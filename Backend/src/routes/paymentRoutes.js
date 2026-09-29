const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createRazorpayOrder,
    verifyPayment,
    reportPaymentFailure
} = require("../controllers/paymentController");

const router = express.Router();

router.post(
    "/create-order",
    protect,
    createRazorpayOrder
);

router.post(
    "/verify",
    protect,
    verifyPayment
);

router.post(
    "/failure",
    protect,
    reportPaymentFailure
);

module.exports = router;