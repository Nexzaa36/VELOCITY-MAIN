const { getChannel } = require("./rabbitmq");

const {
    EXCHANGE_NAME,
    INVENTORY_RESERVED_QUEUE,
    INVENTORY_RESERVED_ORDER_ROUTING_KEY
} = require("./eventConfig");

const Order = require("../models/Order");


// =========================================
// START INVENTORY RESERVED CONSUMER
// =========================================

const startInventoryReservedConsumer = async () => {

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
        INVENTORY_RESERVED_QUEUE,
        {
            durable: true
        }
    );


    // =========================================
    // BIND QUEUE
    // =========================================

    await channel.bindQueue(
        INVENTORY_RESERVED_QUEUE,
        EXCHANGE_NAME,
        INVENTORY_RESERVED_ORDER_ROUTING_KEY
    );


    console.log(
        "InventoryReserved consumer started"
    );


    // =========================================
    // CONSUME INVENTORY RESERVED
    // =========================================

    channel.consume(
        INVENTORY_RESERVED_QUEUE,

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
                    "Order received InventoryReserved"
                );

                console.log(
                    "Order ID:",
                    event.data.orderId
                );

                console.log(
                    "Reservation ID:",
                    event.data.reservationId
                );

                console.log(
                    "================================="
                );


                const {
                    orderId
                } = event.data;


                // =====================================
                // FIND ORDER
                // =====================================

                const order =
                    await Order.findById(orderId);


                if (!order) {

                    throw new Error(
                        `Order not found: ${orderId}`
                    );

                }


                // =====================================
                // IDEMPOTENCY
                // =====================================

                if (
                    order.status === "CONFIRMED"
                ) {

                    console.log(
                        "Order already confirmed:",
                        orderId
                    );

                    channel.ack(message);

                    return;
                }


                // =====================================
                // UPDATE ORDER
                // =====================================

                order.status = "CONFIRMED";

                await order.save();


                console.log(
                    "================================="
                );

                console.log(
                    "Order status updated"
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


                // =====================================
                // ACK MESSAGE
                // =====================================

                channel.ack(message);


            } catch (error) {

                console.error(
                    "================================="
                );

                console.error(
                    "INVENTORY RESERVED PROCESSING ERROR"
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
    startInventoryReservedConsumer
};