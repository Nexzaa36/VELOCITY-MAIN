const { getChannel } =require("./rabbitmq");
const crypto = require("crypto");

const {
    publishEvent
} = require("./eventPublisher");

const {
    EXCHANGE_NAME,

    PAYMENT_FAILED_QUEUE,

    PAYMENT_FAILED_ORDER_ROUTING_KEY

} = require("./eventConfig");

const Order =
    require("../models/Order");


// ========================================
// START PAYMENT FAILED CONSUMER
// ========================================

const startPaymentFailedConsumer = async () => {

    const channel =
        getChannel();


    // ========================================
    // EXCHANGE
    // ========================================

    await channel.assertExchange(

        EXCHANGE_NAME,

        "topic",

        {
            durable: true
        }

    );


    // ========================================
    // QUEUE
    // ========================================

    await channel.assertQueue(

        PAYMENT_FAILED_QUEUE,

        {
            durable: true
        }

    );


    // ========================================
    // BIND QUEUE
    // ========================================

    await channel.bindQueue(

        PAYMENT_FAILED_QUEUE,

        EXCHANGE_NAME,

        PAYMENT_FAILED_ORDER_ROUTING_KEY

    );


    console.log(
        "PaymentFailed consumer started"
    );


    // ========================================
    // CONSUME PAYMENT FAILED
    // ========================================

    channel.consume(

        PAYMENT_FAILED_QUEUE,

        async (message) => {

            if (!message) {

                return;

            }


            try {

                // ========================================
                // PARSE EVENT
                // ========================================

                const event =
                    JSON.parse(
                        message.content.toString()
                    );


                console.log(
                    "================================="
                );

                console.log(
                    "Order received PaymentFailed"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "Payment ID:",
                    event.data.paymentId
                );

                console.log(
                    "Amount:",
                    event.data.amount
                );

                console.log(
                    "Reason:",
                    event.data.reason
                );

                console.log(
                    "================================="
                );


                // ========================================
                // GET ORDER ID
                // ========================================

                const {
                    orderId
                } = event.data;


                // ========================================
                // FIND ORDER
                // ========================================

                const order =
                    await Order.findById(
                        orderId
                    );


                if (!order) {

                    throw new Error(

                        `Order not found: ${orderId}`

                    );

                }


                // ========================================
                // IDEMPOTENCY CHECK
                // ========================================

                if (
                    order.status ===
                    "CANCELLED"
                ) {

                    console.log(

                        "Order already cancelled:",

                        orderId

                    );


                    channel.ack(
                        message
                    );


                    return;

                }


                // ========================================
                // CANCEL ORDER
                // ========================================

                order.status = "CANCELLED";


                await order.save();
                const orderCancelledEvent = {
                    eventId: crypto.randomUUID(),
                    eventType: "OrderCancelled",
                    timestamp: new Date().toISOString(),
                    data: {
                        orderId: String(order._id),
                        userId: String(order.userId),
                        reason: event.data.reason
                    }
                };

                await publishEvent(
                    "order.cancelled",
                    orderCancelledEvent
                );

                console.log(
                    "OrderCancelled event published"
                );

                // ========================================
                // LOG RESULT
                // ========================================

                console.log(
                    "================================="
                );

                console.log(
                    "ORDER CANCELLED"
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "Status:",
                    order.status
                );

                console.log(
                    "================================="
                );


                // ========================================
                // ACK MESSAGE
                // ========================================

                channel.ack(
                    message
                );


            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "PAYMENT FAILED PROCESSING ERROR"
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


// ========================================
// EXPORT
// ========================================

module.exports = {

    startPaymentFailedConsumer

};