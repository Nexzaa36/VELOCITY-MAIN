const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    INVENTORY_ORDER_CREATED_QUEUE,
    INVENTORY_ORDER_CREATED_ROUTING_KEY,
    INVENTORY_RESERVED_ROUTING_KEY
} = require("./eventConfig");

const InventoryReservation = require("../models/InventoryReservation");
const Product = require("../models/Product");
const crypto = require("crypto");

const {
    publishEvent
} = require("./eventPublisher");

const startInventoryConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        { durable: true }
    );

    await channel.assertQueue(
        INVENTORY_ORDER_CREATED_QUEUE,
        { durable: true }
    );

    await channel.bindQueue(
        INVENTORY_ORDER_CREATED_QUEUE,
        EXCHANGE_NAME,
        INVENTORY_ORDER_CREATED_ROUTING_KEY
    );

    console.log("Inventory consumer started");

    channel.consume(
        INVENTORY_ORDER_CREATED_QUEUE,
        async message => {
            if (!message) {
                return;
            }

            try {
                const event =
                    JSON.parse(
                        message.content.toString()
                    );

                console.log("=================================");
                console.log("Inventory received OrderCreated");
                console.log("Order ID:", event.data.orderId);
                console.log("=================================");

                const {
                    orderId,
                    userId,
                    items
                } = event.data;

                const existingReservation =
                    await InventoryReservation.findOne({
                        orderId
                    });

                if (existingReservation) {
                    console.log(
                        "Inventory already processed for order:",
                        orderId
                    );

                    channel.ack(message);
                    return;
                }

                const reservedProducts = [];

                for (const item of items) {
                    const product =
                        await Product.findById(
                            item.productId
                        );

                    if (!product) {
                        throw new Error(
                            `Product not found: ${item.productId}`
                        );
                    }

                    console.log(
                        "Checking stock:",
                        product.name,
                        "| Requested:",
                        item.quantity,
                        "| Available:",
                        product.stock
                    );

                    const updatedProduct =
                        await Product.findOneAndUpdate(
                            {
                                _id: item.productId,
                                stock: {
                                    $gte: item.quantity
                                }
                            },
                            {
                                $inc: {
                                    stock: -item.quantity
                                }
                            },
                            {
                                new: true
                            }
                        );

                    if (!updatedProduct) {
                        for (
                            const reserved of reservedProducts
                        ) {
                            await Product.findByIdAndUpdate(
                                reserved.productId,
                                {
                                    $inc: {
                                        stock:
                                            reserved.quantity
                                    }
                                }
                            );
                        }

                        throw new Error(
                            `Insufficient stock for ${product.name}`
                        );
                    }

                    reservedProducts.push({
                        productId: item.productId,
                        quantity: item.quantity
                    });

                    console.log(
                        "Stock updated:",
                        product.name,
                        "| Remaining:",
                        updatedProduct.stock
                    );
                }

                const reservation =
                    await InventoryReservation.create({
                        orderId,
                        userId,
                        items: items.map(item => ({
                            productId:
                                item.productId,
                            quantity:
                                item.quantity
                        })),
                        status: "RESERVED"
                    });

                console.log("=================================");
                console.log("Inventory reserved successfully");
                console.log("Reservation ID:", reservation._id);
                console.log("Order ID:", orderId);
                console.log("=================================");

                const inventoryReservedEvent = {
                    eventId:
                        crypto.randomUUID(),

                    eventType:
                        "InventoryReserved",

                    timestamp:
                        new Date().toISOString(),

                    data: {
                        reservationId:
                            reservation._id.toString(),

                        orderId:
                            orderId.toString(),

                        userId:
                            userId.toString(),

                        amount:
                            event.data.totalAmount,

                        items:
                            reservation.items.map(item => ({
                                productId:
                                    item.productId.toString(),

                                quantity:
                                    item.quantity
                            }))
                    }
                };

                await publishEvent(
                    INVENTORY_RESERVED_ROUTING_KEY,
                    inventoryReservedEvent
                );

                console.log(
                    "InventoryReserved event published"
                );

                channel.ack(message);

            } catch (error) {

                console.error("=================================");
                console.error("INVENTORY RESERVATION ERROR");
                console.error(error.message);
                console.error("=================================");

                channel.nack(
                    message,
                    false,
                    false
                );
            }
        }
    );
};

module.exports = {
    startInventoryConsumer
};