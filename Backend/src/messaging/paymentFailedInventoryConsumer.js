const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    PAYMENT_FAILED_ORDER_ROUTING_KEY,
    INVENTORY_PAYMENT_FAILED_QUEUE,
    INVENTORY_RELEASED_ROUTING_KEY
} = require("./eventConfig");

const InventoryReservation =
    require("../models/InventoryReservation");

const crypto = require("crypto");

const {
    publishEvent
} = require("./eventPublisher");

const startPaymentFailedInventoryConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        { durable: true }
    );

    await channel.assertQueue(
        INVENTORY_PAYMENT_FAILED_QUEUE,
        { durable: true }
    );

    await channel.bindQueue(
        INVENTORY_PAYMENT_FAILED_QUEUE,
        EXCHANGE_NAME,
        PAYMENT_FAILED_ORDER_ROUTING_KEY
    );

    console.log(
        "PaymentFailed inventory consumer started"
    );

    channel.consume(
        INVENTORY_PAYMENT_FAILED_QUEUE,
        async (message) => {
            if (!message) {
                return;
            }

            try {
                const event =
                    JSON.parse(
                        message.content.toString()
                    );

                const {
                    orderId,
                    userId
                } = event.data;

                console.log(
                    "Inventory received PaymentFailed"
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                const reservation =
                    await InventoryReservation.findOne({
                        orderId
                    });

                if (!reservation) {
                    console.log(
                        "No inventory reservation found:",
                        orderId
                    );

                    channel.ack(message);
                    return;
                }

                if (
                    reservation.status ===
                    "RELEASED"
                ) {
                    console.log(
                        "Inventory already released:",
                        orderId
                    );

                    channel.ack(message);
                    return;
                }

                if (
                    reservation.status !==
                    "RESERVED"
                ) {
                    console.log(
                        "Reservation status:",
                        reservation.status
                    );

                    channel.ack(message);
                    return;
                }

                reservation.status =
                    "RELEASED";

                await reservation.save();

                console.log(
                    "Inventory released:",
                    orderId
                );

                const inventoryReleasedEvent = {
                    eventId:
                        crypto.randomUUID(),
                    eventType:
                        "InventoryReleased",
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

                await publishEvent(
                    INVENTORY_RELEASED_ROUTING_KEY,
                    inventoryReleasedEvent
                );

                console.log(
                    "InventoryReleased event published"
                );

                channel.ack(message);
            } catch (error) {
                console.error(
                    "Inventory release error:",
                    error.message
                );

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
    startPaymentFailedInventoryConsumer
};