const { getChannel } =
    require("./rabbitmq");

const {
    EXCHANGE_NAME,

    PAYMENT_FAILED_QUEUE,
    PAYMENT_FAILED_ROUTING_KEY,

    INVENTORY_RELEASED_ROUTING_KEY
} = require("./eventConfig");

const InventoryReservation =
    require("../models/InventoryReservation");

const crypto =
    require("crypto");

const {
    publishEvent
} = require("./eventPublisher");


// ========================================
// START PAYMENT FAILED INVENTORY CONSUMER
// ========================================

const startPaymentFailedInventoryConsumer = async () => {

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

        PAYMENT_FAILED_ROUTING_KEY

    );


    console.log(
        "PaymentFailed inventory consumer started"
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
                    "Inventory received PaymentFailed"
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
                    "Reason:",
                    event.data.reason
                );

                console.log(
                    "================================="
                );


                const {
                    orderId,
                    userId
                } = event.data;


                // ========================================
                // FIND RESERVATION
                // ========================================

                const reservation =
                    await InventoryReservation.findOne({

                        orderId

                    });


                if (!reservation) {

                    throw new Error(

                        `Inventory reservation not found for order: ${orderId}`

                    );

                }


                // ========================================
                // IDEMPOTENCY CHECK
                // ========================================

                if (
                    reservation.status ===
                    "RELEASED"
                ) {

                    console.log(
                        "Inventory already released for order:",
                        orderId
                    );


                    channel.ack(
                        message
                    );


                    return;

                }


                // ========================================
                // CHECK RESERVATION STATUS
                // ========================================

                if (
                    reservation.status !==
                    "RESERVED"
                ) {

                    console.log(
                        "Inventory reservation is not in RESERVED state:",
                        reservation.status
                    );


                    channel.ack(
                        message
                    );


                    return;

                }


                // ========================================
                // RELEASE INVENTORY RESERVATION
                // ========================================

                reservation.status =
                    "RELEASED";


                await reservation.save();


                console.log(
                    "================================="
                );

                console.log(
                    "INVENTORY RESERVATION RELEASED"
                );

                console.log(
                    "Reservation ID:",
                    reservation._id
                );

                console.log(
                    "Order ID:",
                    orderId
                );

                console.log(
                    "Status:",
                    reservation.status
                );

                console.log(
                    "================================="
                );


                // ========================================
                // CREATE INVENTORY RELEASED EVENT
                // ========================================

                const inventoryReleasedEvent = {

                    eventId:
                        crypto.randomUUID(),

                    eventType:
                        "InventoryReleased",

                    timestamp:
                        new Date().toISOString(),

                    data: {

                        reservationId:
                            reservation._id.toString(),

                        orderId:
                            orderId.toString(),

                        userId:
                            userId.toString(),

                        items:
                            reservation.items.map(
                                (item) => ({

                                    productId:
                                        item.productId.toString(),

                                    quantity:
                                        item.quantity

                                })
                            )

                    }

                };


                // ========================================
                // PUBLISH INVENTORY RELEASED
                // ========================================

                await publishEvent(

                    INVENTORY_RELEASED_ROUTING_KEY,

                    inventoryReleasedEvent

                );


                console.log(
                    "InventoryReleased event published"
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
                    "INVENTORY RELEASE ERROR"
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

    startPaymentFailedInventoryConsumer

};