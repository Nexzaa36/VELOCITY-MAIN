const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME
} = require("./eventConfig");

const EventLog = require("../models/EventLog");

const publishEvent = async (
    routingKey,
    event
) => {
    const channel = getChannel();

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    const message =
        Buffer.from(
            JSON.stringify(event)
        );

    const orderId =
        event?.data?.orderId
            ? String(event.data.orderId)
            : null;

    const userId =
        event?.data?.userId
            ? String(event.data.userId)
            : null;

    try {

        channel.publish(
            EXCHANGE_NAME,
            routingKey,
            message,
            {
                persistent: true,
                contentType: "application/json"
            }
        );

        await channel.waitForConfirms();

        await EventLog.create({
            eventId:
                event.eventId,

            eventType:
                event.eventType,

            routingKey,

            orderId,

            userId,

            status:
                "PUBLISHED",

            data:
                event.data || {},

            timestamp:
                event.timestamp
                    ? new Date(event.timestamp)
                    : new Date()
        });

        console.log(
            `Event published: ${event.eventType}`
        );

        console.log(
            `Event confirmed by RabbitMQ: ${event.eventId}`
        );

        console.log(
            `Event logged: ${event.eventId}`
        );

    } catch (error) {

        console.error(
            "Event publishing/logging error:",
            error.message
        );

        try {

            await EventLog.create({
                eventId:
                    event.eventId,

                eventType:
                    event.eventType,

                routingKey,

                orderId,

                userId,

                status:
                    "FAILED",

                data:
                    event.data || {},

                error:
                    error.message,

                timestamp:
                    event.timestamp
                        ? new Date(
                            event.timestamp
                        )
                        : new Date()
            });

        } catch (logError) {

            console.error(
                "Failed to save event log:",
                logError.message
            );
        }

        throw error;
    }
};

module.exports = {
    publishEvent
};