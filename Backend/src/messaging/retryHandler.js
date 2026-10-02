const {
    EXCHANGE_NAME,
    RETRY_EXCHANGE_NAME,
    DLQ_EXCHANGE_NAME,
    RETRY_DELAY,
    MAX_RETRIES
} = require("./eventConfig");

const getRetryQueueName = (
    queueName,
    routingKey
) => {
    const safeRoutingKey =
        routingKey.replace(
            /[^a-zA-Z0-9.-]/g,
            "-"
        );

    return `${queueName}.retry.${safeRoutingKey}`;
};

const getDlqQueueName = (
    queueName,
    routingKey
) => {
    const safeRoutingKey =
        routingKey.replace(
            /[^a-zA-Z0-9.-]/g,
            "-"
        );

    return `${queueName}.dlq.${safeRoutingKey}`;
};

const setupRetryInfrastructure = async (
    channel,
    queueName,
    routingKey
) => {
    const retryQueue =
        getRetryQueueName(
            queueName,
            routingKey
        );

    const dlqQueue =
        getDlqQueueName(
            queueName,
            routingKey
        );

    await channel.assertExchange(
        RETRY_EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertExchange(
        DLQ_EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );

    await channel.assertQueue(
        retryQueue,
        {
            durable: true,

            messageTtl:
                RETRY_DELAY,

            deadLetterExchange:
                EXCHANGE_NAME,

            deadLetterRoutingKey:
                routingKey
        }
    );

    await channel.bindQueue(
        retryQueue,
        RETRY_EXCHANGE_NAME,
        queueName
    );

    await channel.assertQueue(
        dlqQueue,
        {
            durable: true
        }
    );

    await channel.bindQueue(
        dlqQueue,
        DLQ_EXCHANGE_NAME,
        queueName
    );

    return {
        retryQueue,
        dlqQueue
    };
};

const retryOrDeadLetter = async (
    channel,
    message,
    queueName,
    routingKey,
    error
) => {
    const headers =
        message.properties.headers || {};

    const retryCount =
        Number(
            headers["x-retry-count"] || 0
        );

    const nextRetry =
        retryCount + 1;

    console.error(
        `Consumer failure: ${queueName}`
    );

    console.error(
        `Routing key: ${routingKey}`
    );

    console.error(
        `Retry ${nextRetry}/${MAX_RETRIES}`
    );

    console.error(
        error.message
    );

    const publishOptions = {
        persistent: true,

        contentType:
            message.properties.contentType ||
            "application/json",

        headers: {
            ...headers,

            "x-retry-count":
                nextRetry,

            "x-original-queue":
                queueName,

            "x-original-routing-key":
                routingKey,

            "x-last-error":
                error.message
        }
    };

    try {

        if (
            nextRetry > MAX_RETRIES
        ) {

            publishOptions.headers[
                "x-dead-lettered-at"
            ] = new Date().toISOString();

            channel.publish(
                DLQ_EXCHANGE_NAME,
                queueName,
                message.content,
                publishOptions
            );

            await channel.waitForConfirms();

            channel.ack(message);

            console.error(
                `Moved to DLQ: ${queueName} [${routingKey}]`
            );

            return;
        }

        channel.publish(
            RETRY_EXCHANGE_NAME,
            queueName,
            message.content,
            publishOptions
        );

        await channel.waitForConfirms();

        channel.ack(message);

        console.log(
            `Retry scheduled: ${queueName} [${routingKey}]`
        );

    } catch (publishError) {

        console.error(
            "Retry/DLQ publish failed:",
            publishError.message
        );

        console.error(
            "Original message was NOT acknowledged"
        );

        channel.nack(
            message,
            false,
            true
        );
    }
};

module.exports = {
    setupRetryInfrastructure,
    retryOrDeadLetter
};