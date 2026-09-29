const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME
} = require("./eventConfig");

const publishEvent = async (routingKey, event) => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    const message = Buffer.from(
        JSON.stringify(event)
    );

    channel.publish(
        EXCHANGE_NAME,
        routingKey,
        message,
        {
            persistent: true,
            contentType: "application/json"
        }
    );

    console.log(
        `Event published: ${event.eventType}`
    );
};

module.exports = {
    publishEvent
};