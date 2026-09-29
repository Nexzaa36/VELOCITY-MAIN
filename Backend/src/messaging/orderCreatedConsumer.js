const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    ORDER_CREATED_QUEUE,
    ORDER_CREATED_ROUTING_KEY
} = require("./eventConfig");

const startOrderCreatedConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        ORDER_CREATED_QUEUE,
        {
            durable: true
        }
    );

    await channel.bindQueue(
        ORDER_CREATED_QUEUE,
        EXCHANGE_NAME,
        ORDER_CREATED_ROUTING_KEY
    );

    console.log(
        "OrderCreated consumer started"
    );

    channel.consume(
        ORDER_CREATED_QUEUE,
        (message) => {

            if (!message) {
                return;
            }

            try {
                const event = JSON.parse(
                    message.content.toString()
                );

                console.log(
                    "================================="
                );

                console.log(
                    "OrderCreated event received"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "User ID:",
                    event.data.userId
                );

                console.log(
                    "Total:",
                    event.data.totalAmount
                );

                console.log(
                    "================================="
                );

                channel.ack(message);

            } catch (error) {

                console.error(
                    "Failed to process OrderCreated:",
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
    startOrderCreatedConsumer
};