const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const {
    createRazorpayOrder,
    verifyPayment
} = require("../controllers/paymentController");


const router =
    express.Router();


// ========================================
// CREATE RAZORPAY ORDER
// ========================================

router.post(
    "/create-order",
    protect,
    createRazorpayOrder
);


// ========================================
// VERIFY RAZORPAY PAYMENT
// ========================================

router.post(
    "/verify",
    protect,
    verifyPayment
);


module.exports = router;