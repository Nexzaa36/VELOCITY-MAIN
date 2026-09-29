const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    NOTIFICATION_QUEUE,
    NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY,
    NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY,
    NOTIFICATION_ORDER_CANCELLED_ROUTING_KEY
} = require("./eventConfig");

const startNotificationConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        { durable: true }
    );

    await channel.assertQueue(
        NOTIFICATION_QUEUE,
        { durable: true }
    );

    await channel.bindQueue(
        NOTIFICATION_QUEUE,
        EXCHANGE_NAME,
        NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY
    );

    await channel.bindQueue(
        NOTIFICATION_QUEUE,
        EXCHANGE_NAME,
        NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY
    );

    await channel.bindQueue(
        NOTIFICATION_QUEUE,
        EXCHANGE_NAME,
        NOTIFICATION_ORDER_CANCELLED_ROUTING_KEY
    );

    console.log(
        "Notification consumer started"
    );

    channel.consume(
        NOTIFICATION_QUEUE,
        async (message) => {
            if (!message) {
                return;
            }

            try {
                const event = JSON.parse(
                    message.content.toString()
                );

                const {
                    orderId,
                    userId
                } = event.data;

                console.log(
                    "================================="
                );

                console.log(
                    "NOTIFICATION SERVICE"
                );

                console.log(
                    "Event:",
                    event.eventType
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "User ID:",
                    userId
                );

                if (
                    event.eventType ===
                    "PaymentProcessed"
                ) {
                    console.log(
                        "Notification: Payment successful"
                    );

                    console.log(
                        "Message: Your payment was successful and your order is confirmed."
                    );
                }

                if (
                    event.eventType ===
                    "PaymentFailed"
                ) {
                    console.log(
                        "Notification: Payment failed"
                    );

                    console.log(
                        "Message: Your payment failed. Please try another payment method."
                    );
                }

                if (
                    event.eventType ===
                    "OrderCancelled"
                ) {
                    console.log(
                        "Notification: Order cancelled"
                    );

                    console.log(
                        "Message: Your order has been cancelled."
                    );
                }

                console.log(
                    "================================="
                );

                channel.ack(message);

            } catch (error) {
                console.error(
                    "Notification error:",
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
    startNotificationConsumer
};