const express = require("express");

const {
    createOrder,
    getUserOrders,
    getOrderById
} = require("../controllers/orderController");

const router = express.Router();


// Get one order
router.get("/order/:orderId", getOrderById);


// Create order from user's cart
router.post("/:userId", createOrder);


// Get all orders for a user
router.get("/:userId", getUserOrders);


module.exports = router;