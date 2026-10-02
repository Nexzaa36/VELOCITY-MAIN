const amqp = require("amqplib");

const RABBITMQ_URL =
    process.env.RABBITMQ_URL ||
    "amqp://localhost:5672";

let connection;
let channel;

const connectRabbitMQ = async () => {
    try {
        connection =
            await amqp.connect(
                RABBITMQ_URL
            );

        channel =
            await connection.createConfirmChannel();

        console.log(
            "================================="
        );

        console.log(
            "RabbitMQ connected successfully"
        );

        console.log(
            "RabbitMQ confirm channel ready"
        );

        console.log(
            "================================="
        );

        connection.on(
            "error",
            (error) => {
                console.error(
                    "RabbitMQ connection error:",
                    error.message
                );
            }
        );

        connection.on(
            "close",
            () => {
                console.log(
                    "RabbitMQ connection closed"
                );
            }
        );

        channel.on(
            "error",
            (error) => {
                console.error(
                    "RabbitMQ channel error:",
                    error.message
                );
            }
        );

        channel.on(
            "close",
            () => {
                console.log(
                    "RabbitMQ channel closed"
                );
            }
        );

        return channel;

    } catch (error) {

        console.error(
            "RabbitMQ connection failed:",
            error.message
        );

        throw error;
    }
};

const getChannel = () => {

    if (!channel) {
        throw new Error(
            "RabbitMQ channel is not initialized"
        );
    }

    return channel;
};

module.exports = {
    connectRabbitMQ,
    getChannel
};