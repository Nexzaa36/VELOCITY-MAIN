const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,

    INVENTORY_ORDER_CREATED_QUEUE,
    INVENTORY_ORDER_CREATED_ROUTING_KEY,

    INVENTORY_RESERVED_ROUTING_KEY
} = require("./eventConfig");

const InventoryReservation =
    require("../models/InventoryReservation");

const Product =
    require("../models/Product");

const crypto =
    require("crypto");

const {
    publishEvent
} = require("./eventPublisher");


// =========================================
// START INVENTORY CONSUMER
// =========================================

const startInventoryConsumer = async () => {

    const channel = getChannel();


    // =========================================
    // EXCHANGE
    // =========================================

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );


    // =========================================
    // QUEUE
    // =========================================

    await channel.assertQueue(
        INVENTORY_ORDER_CREATED_QUEUE,
        {
            durable: true
        }
    );


    // =========================================
    // BIND QUEUE
    // =========================================

    await channel.bindQueue(
        INVENTORY_ORDER_CREATED_QUEUE,
        EXCHANGE_NAME,
        INVENTORY_ORDER_CREATED_ROUTING_KEY
    );


    console.log(
        "Inventory consumer started"
    );


    // =========================================
    // CONSUME ORDER CREATED
    // =========================================

    channel.consume(
        INVENTORY_ORDER_CREATED_QUEUE,

        async (message) => {

            if (!message) {
                return;
            }


            try {

                const event =
                    JSON.parse(
                        message.content.toString()
                    );


                console.log(
                    "================================="
                );

                console.log(
                    "Inventory received OrderCreated"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "================================="
                );


                const {
                    orderId,
                    userId,
                    items
                } = event.data;


                // =====================================
                // CHECK IF ALREADY RESERVED
                // =====================================

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


                // =====================================
                // CHECK ALL PRODUCTS
                // =====================================

                for (
                    const item of items
                ) {

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


                    if (
                        item.quantity >
                        product.stock
                    ) {

                        throw new Error(
                            `Insufficient stock for ${product.name}`
                        );

                    }

                }


                // =====================================
                // CREATE RESERVATION
                // =====================================

                const reservation =
                    await InventoryReservation.create({

                        orderId,

                        userId,

                        items: items.map(
                            (item) => ({

                                productId:
                                    item.productId,

                                quantity:
                                    item.quantity

                            })
                        ),

                        status:
                            "RESERVED"

                    });


                console.log(
                    "================================="
                );

                console.log(
                    "Inventory reserved successfully"
                );

                console.log(
                    "Reservation ID:",
                    reservation._id
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "================================="
                );


                // =====================================
                // CREATE INVENTORY RESERVED EVENT
                // =====================================

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

                        items:
                            reservation.items.map(
                                (item) => ({

                                    productId:
                                        item.productId.toString(),

                                    quantity:
                                        item.quantity

                                })
                            )

                    }

                };


                // =====================================
                // PUBLISH INVENTORY RESERVED
                // =====================================

                await publishEvent(

                    INVENTORY_RESERVED_ROUTING_KEY,

                    inventoryReservedEvent

                );


                console.log(
                    "InventoryReserved event published"
                );


                // =====================================
                // ACK MESSAGE
                // =====================================

                channel.ack(message);


            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "INVENTORY RESERVATION ERROR"
                );

                console.error(
                    error.message
                );

                console.error(
                    "================================="
                );


                /*
                 * For now we acknowledge the message
                 * so an invalid order does not loop
                 * forever.
                 *
                 * Retry/DLQ handling will be added
                 * later in the event-driven phase.
                 */

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