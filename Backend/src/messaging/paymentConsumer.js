const {
    getChannel
} = require("./rabbitmq");

const {
    EXCHANGE_NAME,

    PAYMENT_INVENTORY_RESERVED_QUEUE,
    PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
} = require("./eventConfig");


const startPaymentConsumer = async () => {

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
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        {
            durable: true
        }
    );


    // ========================================
    // BIND QUEUE
    // ========================================

    await channel.bindQueue(
        PAYMENT_INVENTORY_RESERVED_QUEUE,
        EXCHANGE_NAME,
        PAYMENT_INVENTORY_RESERVED_ROUTING_KEY
    );


    console.log(
        "Payment consumer started"
    );


    // ========================================
    // CONSUME INVENTORY RESERVED
    // ========================================

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
                 * IMPORTANT
                 *
                 * We do NOT create a successful
                 * payment here.
                 *
                 * Razorpay payment is now started
                 * from the checkout flow.
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