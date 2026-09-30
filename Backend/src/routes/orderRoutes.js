const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const {

    createOrder,

    getUserOrders,

    getOrderById,

    getAllOrdersForAdmin,

    getAdminOrderById,

    updateOrderTrackingStatus

} = require("../controllers/orderController");

const router =
    express.Router();


// ========================================
// ADMIN - GET ALL ORDERS
// ========================================

router.get(
    "/admin/all",
    protect,
    getAllOrdersForAdmin
);


// ========================================
// ADMIN - GET SINGLE ORDER
// ========================================

router.get(
    "/admin/:orderId",
    protect,
    getAdminOrderById
);


// ========================================
// ADMIN - UPDATE TRACKING STATUS
// ========================================

router.patch(
    "/admin/:orderId/tracking",
    protect,
    updateOrderTrackingStatus
);


// ========================================
// CUSTOMER - GET ONE ORDER
// ========================================

router.get(
    "/order/:orderId",
    protect,
    getOrderById
);


// ========================================
// CREATE ORDER
// ========================================

router.post(
    "/:userId",
    protect,
    createOrder
);


// ========================================
// GET USER ORDERS
// ========================================

router.get(
    "/:userId",
    protect,
    getUserOrders
);


module.exports = router;