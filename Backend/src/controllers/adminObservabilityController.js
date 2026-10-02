const mongoose = require("mongoose");

const EventLog =
    require("../models/EventLog");

const Order =
    require("../models/Order");

const Payment =
    require("../models/Payment");

const InventoryReservation =
    require("../models/InventoryReservation");

const {
    getChannel
} = require("../messaging/rabbitmq");


// ========================================
// EVENT HISTORY
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
            filter.eventType =
                eventType;
        }


        if (status) {
            filter.status =
                status;
        }


        if (orderId) {
            filter.orderId =
                orderId;
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

            EventLog.countDocuments(
                filter
            )

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
// EVENTS FOR ONE ORDER
// ========================================

const getOrderEvents = async (
    req,
    res
) => {

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
// SAGA STATUS
// ========================================

const calculateSagaStatus = ({
    order,
    events
}) => {

    const eventTypes =
        events.map(
            event =>
                event.eventType
        );


    const hasEvent =
        eventType =>
            eventTypes.includes(
                eventType
            );


    /*
        ACTUAL VELOCITY FLOW

        OrderCreated
            ↓
        InventoryReserved
            ↓
        PaymentProcessed
            ↓
        Order CONFIRMED

        Failure:

        PaymentFailed
            ↓
        OrderCancelled
            ↓
        InventoryReleased
    */


    if (
        hasEvent(
            "InventoryReleased"
        )
    ) {

        return "COMPENSATED";

    }


    if (
        hasEvent(
            "PaymentFailed"
        )
    ) {

        return "COMPENSATING";

    }


    if (
        hasEvent(
            "PaymentProcessed"
        ) &&
        order.status ===
            "CONFIRMED"
    ) {

        return "COMPLETED";

    }


    if (
        hasEvent(
            "InventoryReserved"
        ) &&
        !hasEvent(
            "PaymentProcessed"
        ) &&
        !hasEvent(
            "PaymentFailed"
        )
    ) {

        return "WAITING_PAYMENT";

    }


    if (
        hasEvent(
            "OrderCreated"
        ) &&
        !hasEvent(
            "InventoryReserved"
        )
    ) {

        return "WAITING_INVENTORY";

    }


    return "IN_PROGRESS";

};


// ========================================
// SAGA MONITOR
// ========================================

const getSagas = async (
    req,
    res
) => {

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


        const skip =
            (pageNumber - 1) *
            limitNumber;


        const orders =
            await Order
                .find({})
                .sort({
                    createdAt: -1
                })
                .skip(skip)
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
                        $in:
                            orderIds
                    }
                })
                .sort({
                    timestamp: 1
                })
                .lean();


        const payments =
            await Payment
                .find({
                    orderId: {
                        $in:
                            orderIds
                    }
                })
                .lean();


        const reservations =
            await InventoryReservation
                .find({
                    orderId: {
                        $in:
                            orderIds
                    }
                })
                .lean();


        const eventMap =
            new Map();


        for (const event of events) {

            if (
                !eventMap.has(
                    event.orderId
                )
            ) {

                eventMap.set(
                    event.orderId,
                    []
                );

            }


            eventMap
                .get(event.orderId)
                .push(event);

        }


        const paymentMap =
            new Map();


        for (const payment of payments) {

            paymentMap.set(
                payment.orderId.toString(),
                payment
            );

        }


        const reservationMap =
            new Map();


        for (
            const reservation
            of reservations
        ) {

            reservationMap.set(
                reservation.orderId.toString(),
                reservation
            );

        }


        const sagas =
            orders.map(order => {

                const orderId =
                    order._id.toString();


                const orderEvents =
                    eventMap.get(
                        orderId
                    ) || [];


                const payment =
                    paymentMap.get(
                        orderId
                    );


                const reservation =
                    reservationMap.get(
                        orderId
                    );


                return {

                    orderId,

                    orderStatus:
                        order.status,

                    trackingStatus:
                        order.trackingStatus,

                    sagaStatus:
                        calculateSagaStatus({
                            order,
                            events:
                                orderEvents
                        }),

                    paymentStatus:
                        payment
                            ? payment.status
                            : null,

                    inventoryStatus:
                        reservation
                            ? reservation.status
                            : null,

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

                page:
                    pageNumber,

                limit:
                    limitNumber,

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
// ONE ORDER SAGA
// ========================================

const getSagaByOrderId = async (
    req,
    res
) => {

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


        const [
            events,
            payment,
            reservation
        ] = await Promise.all([

            EventLog
                .find({
                    orderId
                })
                .sort({
                    timestamp: 1
                })
                .lean(),

            Payment
                .findOne({
                    orderId
                })
                .lean(),

            InventoryReservation
                .findOne({
                    orderId
                })
                .lean()

        ]);


        const sagaStatus =
            calculateSagaStatus({
                order,
                events
            });


        return res.status(200).json({

            success: true,

            saga: {

                orderId,

                orderStatus:
                    order.status,

                trackingStatus:
                    order.trackingStatus,

                sagaStatus,

                paymentStatus:
                    payment
                        ? payment.status
                        : null,

                inventoryStatus:
                    reservation
                        ? reservation.status
                        : null,

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
// SYSTEM METRICS
// ========================================

const getMetrics = async (
    req,
    res
) => {

    try {

        const [

            totalOrders,

            confirmedOrders,

            pendingOrders,

            failedOrders,

            cancelledOrders,

            totalEvents,

            publishedEvents,

            failedEvents,

            reservedInventory,

            releasedInventory,

            failedInventory,

            pendingPayments,

            successfulPayments,

            failedPayments

        ] = await Promise.all([


            Order.countDocuments(),


            Order.countDocuments({
                status:
                    "CONFIRMED"
            }),


            Order.countDocuments({
                status:
                    "PENDING"
            }),


            Order.countDocuments({
                status:
                    "FAILED"
            }),


            Order.countDocuments({
                status:
                    "CANCELLED"
            }),


            EventLog.countDocuments(),


            EventLog.countDocuments({
                status:
                    "PUBLISHED"
            }),


            EventLog.countDocuments({
                status:
                    "FAILED"
            }),


            InventoryReservation.countDocuments({
                status:
                    "RESERVED"
            }),


            InventoryReservation.countDocuments({
                status:
                    "RELEASED"
            }),


            InventoryReservation.countDocuments({
                status:
                    "FAILED"
            }),


            Payment.countDocuments({
                status:
                    "PENDING"
            }),


            Payment.countDocuments({
                status:
                    "SUCCESS"
            }),


            Payment.countDocuments({
                status:
                    "FAILED"
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

                    total:
                        totalOrders,

                    pending:
                        pendingOrders,

                    successful:
                        confirmedOrders,

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

                    pending:
                        pendingPayments,

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
// SYSTEM HEALTH
// ========================================

const getHealth = async (
    req,
    res
) => {

    const health = {

        api: {
            status:
                "UP"
        },

        mongodb: {
            status:
                "DOWN"
        },

        rabbitmq: {
            status:
                "DOWN"
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


    if (
        mongoose.connection
            .readyState === 1
    ) {

        health.mongodb.status =
            "UP";

    } else {

        overallStatus =
            "DEGRADED";

    }


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


    if (
        health.payment.status ===
        "NOT_CONFIGURED"
    ) {

        overallStatus =
            "DEGRADED";

    }


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