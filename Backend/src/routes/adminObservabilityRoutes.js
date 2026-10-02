const express = require("express");

const adminProtect =
    require("../middleware/adminMiddleware");

const {

    getEvents,

    getOrderEvents,

    getSagas,

    getSagaByOrderId,

    getMetrics,

    getHealth

} = require(
    "../controllers/adminObservabilityController"
);


const router =
    express.Router();


// ========================================
// EVENT HISTORY
// ========================================

router.get(
    "/events",
    adminProtect,
    getEvents
);


// ========================================
// ORDER EVENT HISTORY
// ========================================

router.get(
    "/events/:orderId",
    adminProtect,
    getOrderEvents
);


// ========================================
// SAGA MONITOR
// ========================================

router.get(
    "/sagas",
    adminProtect,
    getSagas
);


// ========================================
// SINGLE ORDER SAGA
// ========================================

router.get(
    "/sagas/:orderId",
    adminProtect,
    getSagaByOrderId
);


// ========================================
// SYSTEM METRICS
// ========================================

router.get(
    "/metrics",
    adminProtect,
    getMetrics
);


// ========================================
// SYSTEM HEALTH
// ========================================

router.get(
    "/health",
    adminProtect,
    getHealth
);


module.exports = router;