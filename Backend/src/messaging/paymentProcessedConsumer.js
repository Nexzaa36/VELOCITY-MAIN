const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    PAYMENT_PROCESSED_QUEUE,
    PAYMENT_PROCESSED_ROUTING_KEY
} = require("./eventConfig");

const Order = require("../models/Order");

const {
    updateTrackingStatus
} = require("../services/trackingService");

const startPaymentProcessedConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        PAYMENT_PROCESSED_QUEUE,
        {
            durable: true
        }
    );

    await channel.bindQueue(
        PAYMENT_PROCESSED_QUEUE,
        EXCHANGE_NAME,
        PAYMENT_PROCESSED_ROUTING_KEY
    );

    console.log(
        "PaymentProcessed consumer started"
    );

    channel.consume(
        PAYMENT_PROCESSED_QUEUE,

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
                    "Order received PaymentProcessed"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "Payment ID:",
                    event.data.paymentId
                );

                console.log(
                    "Amount:",
                    event.data.amount
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
                    order.status === "CONFIRMED"
                ) {
                    console.log(
                        "Order already confirmed:",
                        orderId
                    );

                    channel.ack(message);

                    return;
                }

                order.status =
                    "CONFIRMED";

                await order.save();

                await updateTrackingStatus(
                    order,
                    "PAID"
                );

                await updateTrackingStatus(
                    order,
                    "CONFIRMED"
                );

                console.log(
                    "================================="
                );

                console.log(
                    "PAYMENT SUCCESS"
                );

                console.log(
                    "Order confirmed"
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "Status:",
                    order.status
                );

                console.log(
                    "Tracking Status:",
                    order.trackingStatus
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
                    "PAYMENT PROCESSED ERROR"
                );

                console.error(
                    error.message
                );

                console.error(
                    "================================="
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
    startPaymentProcessedConsumer
};