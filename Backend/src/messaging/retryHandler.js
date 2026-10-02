const {
    EXCHANGE_NAME,
    RETRY_EXCHANGE_NAME,
    DLQ_EXCHANGE_NAME,
    RETRY_DELAY,
    MAX_RETRIES
} = require("./eventConfig");


const getSafeRoutingKey = (
    routingKey
) => {
    return routingKey.replace(
        /[^a-zA-Z0-9.-]/g,
        "-"
    );
};


const getRetryQueueName = (
    queueName,
    routingKey
) => {
    return `${queueName}.retry.${getSafeRoutingKey(routingKey)}`;
};


const getDlqQueueName = (
    queueName,
    routingKey
) => {
    return `${queueName}.dlq.${getSafeRoutingKey(routingKey)}`;
};


const getRetryBindingKey = (
    queueName,
    routingKey
) => {
    return `${queueName}.retry.${getSafeRoutingKey(routingKey)}`;
};


const getDlqBindingKey = (
    queueName,
    routingKey
) => {
    return `${queueName}.dlq.${getSafeRoutingKey(routingKey)}`;
};


const setupRetryInfrastructure = async (
    channel,
    queueName,
    routingKeys
) => {

    const keys = Array.isArray(routingKeys)
        ? routingKeys
        : [routingKeys];


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


    const infrastructure = [];


    for (const routingKey of keys) {

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


        const retryBindingKey =
            getRetryBindingKey(
                queueName,
                routingKey
            );


        const dlqBindingKey =
            getDlqBindingKey(
                queueName,
                routingKey
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
            retryBindingKey
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
            dlqBindingKey
        );


        infrastructure.push({
            routingKey,
            retryQueue,
            dlqQueue,
            retryBindingKey,
            dlqBindingKey
        });
    }


    return infrastructure;
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


    const retryBindingKey =
        getRetryBindingKey(
            queueName,
            routingKey
        );


    const dlqBindingKey =
        getDlqBindingKey(
            queueName,
            routingKey
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

                dlqBindingKey,

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

            retryBindingKey,

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