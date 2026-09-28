const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
    createOrder,
    getUserOrders,
    getOrderById
} = require("../controllers/orderController");

const router = express.Router();


// =========================================
// GET ONE ORDER
// =========================================

router.get(
    "/order/:orderId",
    protect,
    getOrderById
);


// =========================================
// CREATE ORDER FROM USER CART
// =========================================

router.post(
    "/:userId",
    protect,
    createOrder
);


// =========================================
// GET ALL ORDERS FOR USER
// =========================================

router.get(
    "/:userId",
    protect,
    getUserOrders
);


module.exports = router;