const Order = require("../models/Order");

const {
    TRACKING_STEP_SECONDS,
    TRACKING_STEPS,
    TRACKING_STATUSES
} = require("../config/trackingConfig");

const updateTrackingStatus = async (order, status) => {
    if (!TRACKING_STATUSES.includes(status)) {
        throw new Error(`Invalid tracking status: ${status}`);
    }

    if (order.trackingStatus === status) {
        return order;
    }

    order.trackingStatus = status;
    order.trackingStatusChangedAt = new Date();

    const alreadyExists = order.trackingHistory.some(
        entry => entry.status === status
    );

    if (!alreadyExists) {
        order.trackingHistory.push({
            status,
            changedAt: new Date()
        });
    }

    await order.save();

    console.log("=================================");
    console.log("TRACKING STATUS UPDATED");
    console.log("Order ID:", order._id);
    console.log("Tracking Status:", status);
    console.log("=================================");

    return order;
};

const advanceTracking = async order => {
    if (!order) {
        return null;
    }

    if (
        order.status === "FAILED" ||
        order.status === "CANCELLED"
    ) {
        return order;
    }

    if (!order.trackingStatus) {
        order.trackingStatus = "PLACED";
        order.trackingStatusChangedAt = new Date();

        order.trackingHistory = [
            {
                status: "PLACED",
                changedAt: new Date()
            }
        ];

        await order.save();

        return order;
    }

    const currentIndex =
        TRACKING_STEPS.indexOf(
            order.trackingStatus
        );

    if (currentIndex === -1) {
        return order;
    }

    if (
        currentIndex >=
        TRACKING_STEPS.length - 1
    ) {
        return order;
    }

    if (!order.trackingStatusChangedAt) {
        order.trackingStatusChangedAt = new Date();

        await order.save();

        return order;
    }

    const elapsedSeconds =
        (
            Date.now() -
            new Date(
                order.trackingStatusChangedAt
            ).getTime()
        ) / 1000;

    if (
        elapsedSeconds <
        TRACKING_STEP_SECONDS
    ) {
        return order;
    }

    const nextStatus =
        TRACKING_STEPS[currentIndex + 1];

    return updateTrackingStatus(
        order,
        nextStatus
    );
};

const syncTrackingWithOrderStatus = async order => {
    if (!order) {
        return null;
    }

    if (order.status === "CANCELLED") {
        if (order.trackingStatus !== "CANCELLED") {
            await updateTrackingStatus(
                order,
                "CANCELLED"
            );
        }

        return order;
    }

    if (order.status === "FAILED") {
        return order;
    }

    if (
        order.status === "CONFIRMED" &&
        (
            order.trackingStatus === "PLACED" ||
            order.trackingStatus === "PAID" ||
            order.trackingStatus === "RESERVED"
        )
    ) {
        await updateTrackingStatus(
            order,
            "CONFIRMED"
        );
    }

    return order;
};

module.exports = {
    updateTrackingStatus,
    advanceTracking,
    syncTrackingWithOrderStatus
};