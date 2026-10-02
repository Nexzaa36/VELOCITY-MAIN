const mongoose = require("mongoose");

const EventLog = require("../models/EventLog");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const InventoryReservation = require("../models/InventoryReservation");

const {
    getChannel
} = require("../messaging/rabbitmq");


// ========================================
// GET EVENT HISTORY
// ========================================

const getEvents = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 50,
            eventType,
            status,
            orderId
        } = req.query;

        const pageNumber =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 50,
                    1
                ),
                100
            );

        const filter = {};

        if (eventType) {
            filter.eventType = eventType;
        }

        if (status) {
            filter.status = status;
        }

        if (orderId) {
            filter.orderId = orderId;
        }

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            events,
            total
        ] = await Promise.all([

            EventLog
                .find(filter)
                .sort({
                    timestamp: -1
                })
                .skip(skip)
                .limit(limitNumber)
                .lean(),

            EventLog.countDocuments(filter)

        ]);

        return res.status(200).json({

            success: true,

            events,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages:
                    Math.ceil(
                        total /
                        limitNumber
                    )
            }

        });

    } catch (error) {

        console.error(
            "Get Events Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load event history"

        });
    }
};


// ========================================
// GET EVENTS FOR ONE ORDER
// ========================================

const getOrderEvents = async (req, res) => {
    try {

        const {
            orderId
        } = req.params;

        if (!orderId) {
            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required"

            });
        }

        const events =
            await EventLog
                .find({
                    orderId
                })
                .sort({
                    timestamp: 1
                })
                .lean();

        return res.status(200).json({

            success: true,

            orderId,

            events

        });

    } catch (error) {

        console.error(
            "Get Order Events Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load order events"

        });
    }
};


// ========================================
// GET SAGA MONITOR
// ========================================

const getSagas = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 30
        } = req.query;

        const pageNumber =
            Math.max(
                parseInt(page, 10) || 1,
                1
            );

        const limitNumber =
            Math.min(
                Math.max(
                    parseInt(limit, 10) || 30,
                    1
                ),
                100
            );


        const orders =
            await Order
                .find({})
                .sort({
                    createdAt: -1
                })
                .skip(
                    (pageNumber - 1) *
                    limitNumber
                )
                .limit(limitNumber)
                .lean();


        const orderIds =
            orders.map(
                order =>
                    order._id.toString()
            );


        const events =
            await EventLog
                .find({
                    orderId: {
                        $in: orderIds
                    }
                })
                .sort({
                    timestamp: 1
                })
                .lean();


        const eventMap = new Map();


        for (const event of events) {

            if (!eventMap.has(event.orderId)) {
                eventMap.set(
                    event.orderId,
                    []
                );
            }

            eventMap
                .get(event.orderId)
                .push(event);
        }


        const sagas =
            orders.map(order => {

                const orderId =
                    order._id.toString();

                const orderEvents =
                    eventMap.get(
                        orderId
                    ) || [];


                const eventTypes =
                    orderEvents.map(
                        event =>
                            event.eventType
                    );


                const has =
                    type =>
                        eventTypes.includes(
                            type
                        );


                let sagaStatus =
                    "IN_PROGRESS";


                if (
                    has("PaymentFailed") ||
                    has("InventoryReservationFailed")
                ) {

                    sagaStatus =
                        "COMPENSATING";

                }


                if (
                    has("InventoryReleased")
                ) {

                    sagaStatus =
                        "COMPENSATED";

                }


                if (
                    has("PaymentProcessed") &&
                    !has("InventoryReleased") &&
                    order.status === "CONFIRMED"
                ) {

                    sagaStatus =
                        "COMPLETED";

                }


                if (
                    has("OrderCreated") &&
                    !has("InventoryReserved") &&
                    !has("InventoryReservationFailed")
                ) {

                    sagaStatus =
                        "WAITING_INVENTORY";

                }


                if (
                    has("InventoryReserved") &&
                    !has("PaymentProcessed") &&
                    !has("PaymentFailed")
                ) {

                    sagaStatus =
                        "WAITING_PAYMENT";

                }


                return {

                    orderId,

                    orderStatus:
                        order.status,

                    trackingStatus:
                        order.trackingStatus,

                    sagaStatus,

                    createdAt:
                        order.createdAt,

                    updatedAt:
                        order.updatedAt,

                    events:
                        orderEvents

                };

            });


        const total =
            await Order.countDocuments();


        return res.status(200).json({

            success: true,

            sagas,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages:
                    Math.ceil(
                        total /
                        limitNumber
                    )
            }

        });

    } catch (error) {

        console.error(
            "Get Sagas Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load SAGA monitor"

        });
    }
};


// ========================================
// GET SAGA FOR ONE ORDER
// ========================================

const getSagaByOrderId = async (req, res) => {
    try {

        const {
            orderId
        } = req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                orderId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order ID"

            });
        }


        const order =
            await Order
                .findById(orderId)
                .lean();


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });
        }


        const events =
            await EventLog
                .find({
                    orderId:
                        orderId
                })
                .sort({
                    timestamp: 1
                })
                .lean();


        const eventTypes =
            events.map(
                event =>
                    event.eventType
            );


        const has =
            type =>
                eventTypes.includes(type);


        let sagaStatus =
            "IN_PROGRESS";


        if (
            has("PaymentFailed") ||
            has("InventoryReservationFailed")
        ) {

            sagaStatus =
                "COMPENSATING";

        }


        if (
            has("InventoryReleased")
        ) {

            sagaStatus =
                "COMPENSATED";

        }


        if (
            has("PaymentProcessed") &&
            order.status === "CONFIRMED"
        ) {

            sagaStatus =
                "COMPLETED";

        }


        if (
            has("OrderCreated") &&
            !has("InventoryReserved") &&
            !has("InventoryReservationFailed")
        ) {

            sagaStatus =
                "WAITING_INVENTORY";

        }


        if (
            has("InventoryReserved") &&
            !has("PaymentProcessed") &&
            !has("PaymentFailed")
        ) {

            sagaStatus =
                "WAITING_PAYMENT";

        }


        return res.status(200).json({

            success: true,

            saga: {

                orderId,

                orderStatus:
                    order.status,

                trackingStatus:
                    order.trackingStatus,

                sagaStatus,

                createdAt:
                    order.createdAt,

                updatedAt:
                    order.updatedAt,

                events

            }

        });

    } catch (error) {

        console.error(
            "Get Saga Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load SAGA"

        });
    }
};


// ========================================
// GET SYSTEM METRICS
// ========================================

const getMetrics = async (req, res) => {
    try {

        const [
            totalOrders,
            successfulOrders,
            failedOrders,
            cancelledOrders,
            totalEvents,
            publishedEvents,
            failedEvents,
            reservedInventory,
            releasedInventory,
            failedInventory,
            successfulPayments,
            failedPayments
        ] = await Promise.all([

            Order.countDocuments(),

            Order.countDocuments({
                status: "CONFIRMED"
            }),

            Order.countDocuments({
                status: "FAILED"
            }),

            Order.countDocuments({
                status: "CANCELLED"
            }),

            EventLog.countDocuments(),

            EventLog.countDocuments({
                status: "PUBLISHED"
            }),

            EventLog.countDocuments({
                status: "FAILED"
            }),

            InventoryReservation.countDocuments({
                status: "RESERVED"
            }),

            InventoryReservation.countDocuments({
                status: "RELEASED"
            }),

            InventoryReservation.countDocuments({
                status: "FAILED"
            }),

            Payment.countDocuments({
                status: {
                    $in: [
                        "SUCCESS",
                        "PAID",
                        "COMPLETED"
                    ]
                }
            }),

            Payment.countDocuments({
                status: {
                    $in: [
                        "FAILED",
                        "FAILURE"
                    ]
                }
            })

        ]);


        const eventBreakdown =
            await EventLog.aggregate([

                {
                    $group: {
                        _id:
                            "$eventType",

                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                }

            ]);


        return res.status(200).json({

            success: true,

            metrics: {

                orders: {
                    total: totalOrders,
                    successful:
                        successfulOrders,
                    failed:
                        failedOrders,
                    cancelled:
                        cancelledOrders
                },

                events: {
                    total:
                        totalEvents,
                    published:
                        publishedEvents,
                    failed:
                        failedEvents
                },

                inventory: {
                    reserved:
                        reservedInventory,
                    released:
                        releasedInventory,
                    failed:
                        failedInventory
                },

                payments: {
                    successful:
                        successfulPayments,
                    failed:
                        failedPayments
                },

                eventBreakdown

            }

        });

    } catch (error) {

        console.error(
            "Get Metrics Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load system metrics"

        });
    }
};


// ========================================
// GET SYSTEM HEALTH
// ========================================

const getHealth = async (req, res) => {

    const health = {

        api: {
            status: "UP"
        },

        mongodb: {
            status: "DOWN"
        },

        rabbitmq: {
            status: "DOWN"
        },

        payment: {
            status:
                process.env.RAZORPAY_KEY_ID
                    ? "CONFIGURED"
                    : "NOT_CONFIGURED"
        },

        notification: {
            status:
                process.env.EMAIL_USER
                    ? "CONFIGURED"
                    : "NOT_CONFIGURED"
        }

    };


    let overallStatus =
        "UP";


    // ========================================
    // MONGODB
    // ========================================

    if (
        mongoose.connection.readyState === 1
    ) {

        health.mongodb.status =
            "UP";

    } else {

        overallStatus =
            "DEGRADED";

    }


    // ========================================
    // RABBITMQ
    // ========================================

    try {

        const channel =
            getChannel();

        if (channel) {

            health.rabbitmq.status =
                "UP";

        }

    } catch (error) {

        overallStatus =
            "DEGRADED";

    }


    // ========================================
    // PAYMENT
    // ========================================

    if (
        health.payment.status ===
        "NOT_CONFIGURED"
    ) {

        overallStatus =
            "DEGRADED";

    }


    // ========================================
    // NOTIFICATION
    // ========================================

    if (
        health.notification.status ===
        "NOT_CONFIGURED"
    ) {

        overallStatus =
            "DEGRADED";

    }


    return res.status(200).json({

        success: true,

        status:
            overallStatus,

        timestamp:
            new Date().toISOString(),

        health

    });

};


module.exports = {

    getEvents,

    getOrderEvents,

    getSagas,

    getSagaByOrderId,

    getMetrics,

    getHealth

};