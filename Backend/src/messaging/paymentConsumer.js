const {
    getChannel
} = require("./rabbitmq");

const {
    EXCHANGE_NAME,

    PAYMENT_INVENTORY_RESERVED_QUEUE,
    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
} = require("./eventConfig");

const {
    setupRetryInfrastructure,
    retryOrDeadLetter
} = require("./retryHandler");

const startPaymentConsumer = async () => {

    const channel =
        getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        {
            durable: true
        }
    );

    await channel.bindQueue(
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        EXCHANGE_NAME,
        PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
    );

    await setupRetryInfrastructure(
        channel,
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
    );

    console.log(
        "Payment consumer started"
    );

    channel.consume(
        PAYMENT_INVENTORY_RESERVED_QUEUE,

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
                    "Payment service received InventoryReserved"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "Amount:",
                    event.data.amount
                );

                console.log(
                    "Waiting for Razorpay payment..."
                );

                console.log(
                    "================================="
                );

                /*
                 * Razorpay payment is started
                 * from the checkout flow.
                 *
                 * This consumer only confirms
                 * that InventoryReserved was received.
                 */

                channel.ack(
                    message
                );

            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "PAYMENT EVENT ERROR"
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
                    PAYMENT_INVENTORY_RESERVED_QUEUE,
                    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY,
                    error
                );
            }
        }
    );
};

module.exports = {
    startPaymentConsumer
};