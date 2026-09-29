const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,

    PAYMENT_INVENTORY_RESERVED_QUEUE,
    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY,

    PAYMENT_PROCESSED_ROUTING_KEY
} = require("./eventConfig");

const Payment =
    require("../models/Payment");

const crypto =
    require("crypto");

const {
    publishEvent
} = require("./eventPublisher");


// =========================================
// START PAYMENT CONSUMER
// =========================================

const startPaymentConsumer = async () => {

    const channel = getChannel();


    // =========================================
    // EXCHANGE
    // =========================================

    await channel.assertExchange(
        EXCHANGE_NAME,
        "topic",
        {
            durable: true
        }
    );


    // =========================================
    // QUEUE
    // =========================================

    await channel.assertQueue(
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        {
            durable: true
        }
    );


    // =========================================
    // BIND QUEUE
    // =========================================

    await channel.bindQueue(
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        EXCHANGE_NAME,
        PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
    );


    console.log(
        "Payment consumer started"
    );


    // =========================================
    // CONSUME INVENTORY RESERVED
    // =========================================

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
                    "Payment received InventoryReserved"
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
                    "================================="
                );


                const {
                    orderId,
                    userId,
                    amount
                } = event.data;


                // =====================================
                // VALIDATE PAYMENT AMOUNT
                // =====================================

                if (
                    typeof amount !== "number" ||
                    amount < 0
                ) {

                    throw new Error(
                        "Invalid payment amount"
                    );

                }


                // =====================================
                // CHECK EXISTING PAYMENT
                // =====================================

                const existingPayment =
                    await Payment.findOne({
                        orderId
                    });


                if (existingPayment) {

                    console.log(
                        "Payment already processed:",
                        orderId
                    );

                    channel.ack(message);

                    return;
                }


                // =====================================
                // CREATE PAYMENT
                // =====================================

                const payment =
                    await Payment.create({

                        orderId,

                        userId,

                        amount,

                        status:
                            "SUCCESS"

                    });


                console.log(
                    "================================="
                );

                console.log(
                    "Payment processed successfully"
                );

                console.log(
                    "Payment ID:",
                    payment._id
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "Amount:",
                    payment.amount
                );

                console.log(
                    "================================="
                );


                // =====================================
                // CREATE PAYMENT PROCESSED EVENT
                // =====================================

                const paymentProcessedEvent = {

                    eventId:
                        crypto.randomUUID(),

                    eventType:
                        "PaymentProcessed",

                    timestamp:
                        new Date().toISOString(),

                    data: {

                        paymentId:
                            payment._id.toString(),

                        orderId:
                            orderId.toString(),

                        userId:
                            userId.toString(),

                        amount:
                            payment.amount

                    }

                };


                // =====================================
                // PUBLISH EVENT
                // =====================================

                await publishEvent(

                    PAYMENT_PROCESSED_ROUTING_KEY,

                    paymentProcessedEvent

                );


                console.log(
                    "PaymentProcessed event published"
                );


                // =====================================
                // ACK MESSAGE
                // =====================================

                channel.ack(message);


            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "PAYMENT PROCESSING ERROR"
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
    startPaymentConsumer
};