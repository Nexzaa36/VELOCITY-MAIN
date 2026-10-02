const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    INVENTORY_RESERVED_QUEUE,
    INVENTORY_RESERVED_ORDER_ROUTING_KEY
} = require("./eventConfig");

const Order = require("../models/Order");

const {
    updateTrackingStatus
} = require("../services/trackingService");

const {
    setupRetryInfrastructure,
    retryOrDeadLetter
} = require("./retryHandler");

const startInventoryReservedConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        INVENTORY_RESERVED_QUEUE,
        {
            durable: true
        }
    );

    await channel.bindQueue(
        INVENTORY_RESERVED_QUEUE,
        EXCHANGE_NAME,
        INVENTORY_RESERVED_ORDER_ROUTING_KEY
    );

    await setupRetryInfrastructure(
        channel,
        INVENTORY_RESERVED_QUEUE,
        INVENTORY_RESERVED_ORDER_ROUTING_KEY
    );

    console.log(
        "InventoryReserved consumer started"
    );

    channel.consume(
        INVENTORY_RESERVED_QUEUE,

        async message => {
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
                    "Order received InventoryReserved"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "Reservation ID:",
                    event.data.reservationId
                );

                console.log(
                    "================================="
                );

                const {
                    orderId
                } = event.data;

                const order =
                    await Order.findById(
                        orderId
                    );

                if (!order) {
                    throw new Error(
                        `Order not found: ${orderId}`
                    );
                }

                if (
                    order.status === "FAILED" ||
                    order.status === "CANCELLED"
                ) {
                    console.log(
                        "Order is no longer active:",
                        orderId
                    );

                    channel.ack(message);

                    return;
                }

                if (
                    order.trackingStatus ===
                    "RESERVED"
                ) {
                    console.log(
                        "Inventory already reserved for order:",
                        orderId
                    );

                    channel.ack(message);

                    return;
                }

                await updateTrackingStatus(
                    order,
                    "RESERVED"
                );

                console.log(
                    "================================="
                );

                console.log(
                    "INVENTORY RESERVED"
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "Tracking Status:",
                    order.trackingStatus
                );

                console.log(
                    "Waiting for PaymentProcessed event..."
                );

                console.log(
                    "================================="
                );

                channel.ack(message);

            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "INVENTORY RESERVED PROCESSING ERROR"
                );

                console.error(
                    error.message
                );

                console.error(
                    "================================="
                );

                await retryOrDeadLetter(
                    channel,
                    message,
                    INVENTORY_RESERVED_QUEUE,
                    INVENTORY_RESERVED_ORDER_ROUTING_KEY,
                    error
                );
            }
        }
    );
};

module.exports = {
    startInventoryReservedConsumer
};