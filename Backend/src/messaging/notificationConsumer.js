const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    NOTIFICATION_QUEUE,
    NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY,
    NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY,
    NOTIFICATION_ORDER_CANCELLED_ROUTING_KEY
} = require("./eventConfig");

const User = require("../models/User");

const {
    sendEmail
} = require("../services/emailService");

const {
    setupRetryInfrastructure,
    retryOrDeadLetter
} = require("./retryHandler");

const startNotificationConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        NOTIFICATION_QUEUE,
        {
            durable: true
        }
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

    await setupRetryInfrastructure(
        channel,
        NOTIFICATION_QUEUE,
        NOTIFICATION_PAYMENT_PROCESSED_ROUTING_KEY
    );

    await setupRetryInfrastructure(
        channel,
        NOTIFICATION_QUEUE,
        NOTIFICATION_PAYMENT_FAILED_ROUTING_KEY
    );

    await setupRetryInfrastructure(
        channel,
        NOTIFICATION_QUEUE,
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
                const event =
                    JSON.parse(
                        message.content.toString()
                    );

                const {
                    orderId,
                    userId
                } = event.data;

                const user =
                    await User.findById(
                        userId
                    );

                if (!user) {
                    throw new Error(
                        `User not found: ${userId}`
                    );
                }

                let subject;
                let messageText;

                if (
                    event.eventType ===
                    "PaymentProcessed"
                ) {
                    subject =
                        "VELOCITY - Payment Successful";

                    messageText =
                        "Your payment was successful and your order is confirmed.";
                }

                if (
                    event.eventType ===
                    "PaymentFailed"
                ) {
                    subject =
                        "VELOCITY - Payment Failed";

                    messageText =
                        "Your payment failed. Please try another payment method.";
                }

                if (
                    event.eventType ===
                    "OrderCancelled"
                ) {
                    subject =
                        "VELOCITY - Order Cancelled";

                    messageText =
                        "Your order has been cancelled.";
                }

                if (
                    !subject ||
                    !messageText
                ) {
                    throw new Error(
                        `Unsupported notification event: ${event.eventType}`
                    );
                }

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
                    "Routing Key:",
                    message.fields.routingKey
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "User ID:",
                    userId
                );

                console.log(
                    "Sending email to:",
                    user.email
                );

                await sendEmail(
                    user.email,
                    subject,
                    messageText,
                    orderId,
                    event.data.amount,
                    event.eventType
                );

                console.log(
                    "Notification email sent"
                );

                console.log(
                    "================================="
                );

                channel.ack(
                    message
                );

            } catch (error) {

                console.error(
                    "Notification error:",
                    error.message
                );

                await retryOrDeadLetter(
                    channel,
                    message,
                    NOTIFICATION_QUEUE,
                    message.fields.routingKey,
                    error
                );
            }
        }
    );
};

module.exports = {
    startNotificationConsumer
};