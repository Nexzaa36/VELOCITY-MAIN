const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Payment = require("../models/Payment");

const {
    publishEvent
} = require("../messaging/eventPublisher");


// ======================================
// RAZORPAY CLIENT
// ======================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ======================================
// CREATE RAZORPAY ORDER
// ======================================

const createRazorpayOrder = async (req, res) => {

    try {

        const userId = req.user.userId;

        const {
            orderId
        } = req.body;


        // ==================================
        // VALIDATE ORDER ID
        // ==================================

        if (!orderId) {

            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });

        }


        // ==================================
        // FIND VELOCITY ORDER
        // ==================================

        const order =
            await Order.findById(orderId);


        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }


        // ==================================
        // SECURITY CHECK
        // ==================================

        if (
            order.userId.toString() !==
            userId.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "You are not allowed to pay for this order"
            });

        }


        // ==================================
        // CHECK ORDER STATUS
        // ==================================

        if (
            order.status !== "PENDING"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    `Order cannot be paid because its status is ${order.status}`
            });

        }


        // ==================================
        // AMOUNT
        // ==================================
        //
        // Razorpay expects the amount
        // in the smallest currency unit.
        //
        // ₹100 = 10000 paise
        //
        // ==================================

        const amountInPaise =
            Math.round(
                order.totalAmount * 100
            );


        // ==================================
        // CREATE RAZORPAY ORDER
        // ==================================

        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    amountInPaise,

                currency:
                    "INR",

                receipt:
                    `velocity_${order._id}`,

                notes: {

                    velocityOrderId:
                        order._id.toString(),

                    userId:
                        userId.toString()

                }

            });


        console.log(
            "================================="
        );

        console.log(
            "Razorpay Order Created"
        );

        console.log(
            "VELOCITY Order:",
            order._id.toString()
        );

        console.log(
            "Razorpay Order:",
            razorpayOrder.id
        );

        console.log(
            "Amount:",
            amountInPaise
        );

        console.log(
            "================================="
        );


        // ==================================
        // SAVE PAYMENT RECORD
        // ==================================

        let payment =
            await Payment.findOne({
                orderId: order._id
            });


        if (!payment) {

            payment =
                await Payment.create({

                    orderId:
                        order._id,

                    userId:
                        userId,

                    amount:
                        order.totalAmount,

                    status:
                        "PENDING",

                    razorpayOrderId:
                        razorpayOrder.id

                });

        } else {

            payment.amount =
                order.totalAmount;

            payment.status =
                "PENDING";

            payment.razorpayOrderId =
                razorpayOrder.id;

            await payment.save();

        }


        // ==================================
        // RESPONSE
        // ==================================

        return res.status(200).json({

            success: true,

            keyId:
                process.env.RAZORPAY_KEY_ID,

            razorpayOrderId:
                razorpayOrder.id,

            amount:
                razorpayOrder.amount,

            currency:
                razorpayOrder.currency,

            velocityOrderId:
                order._id.toString()

        });


    } catch (error) {

        console.error(
            "Create Razorpay Order Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to create Razorpay order"

        });

    }

};


// ======================================
// VERIFY RAZORPAY PAYMENT
// ======================================

const verifyPayment = async (req, res) => {

    try {

        const userId =
            req.user.userId;


        const {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = req.body;


        // ==================================
        // VALIDATE
        // ==================================

        if (
            !orderId ||
            !razorpayOrderId ||
            !razorpayPaymentId ||
            !razorpaySignature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment verification data is incomplete"

            });

        }


        // ==================================
        // FIND VELOCITY ORDER
        // ==================================

        const order =
            await Order.findById(orderId);


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        // ==================================
        // SECURITY CHECK
        // ==================================

        if (
            order.userId.toString() !==
            userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to verify this order"

            });

        }


        // ==================================
        // FIND PAYMENT
        // ==================================

        const payment =
            await Payment.findOne({
                orderId: order._id
            });


        if (!payment) {

            return res.status(404).json({

                success: false,

                message:
                    "Payment record not found"

            });

        }


        // ==================================
        // CHECK RAZORPAY ORDER ID
        // ==================================

        if (
            payment.razorpayOrderId !==
            razorpayOrderId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Razorpay order ID mismatch"

            });

        }


        // ==================================
        // CREATE SIGNATURE
        // ==================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${payment.razorpayOrderId}|${razorpayPaymentId}`
                )
                .digest("hex");


        // ==================================
        // COMPARE SIGNATURE
        // ==================================

        const isSignatureValid =
            crypto.timingSafeEqual(

                Buffer.from(
                    generatedSignature
                ),

                Buffer.from(
                    razorpaySignature
                )

            );


        if (!isSignatureValid) {

            payment.status =
                "FAILED";

            await payment.save();


            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature"

            });

        }


        // ==================================
        // PAYMENT SUCCESS
        // ==================================

        payment.status =
            "SUCCESS";

        payment.razorpayPaymentId =
            razorpayPaymentId;

        await payment.save();


        // ==================================
        // PUBLISH PAYMENT PROCESSED
        // ==================================

        const paymentProcessedEvent = {

            eventId:
                crypto.randomUUID(),

            eventType:
                "PaymentProcessed",

            timestamp:
                new Date().toISOString(),

            data: {

                paymentId:
                    payment._id.toString(),

                orderId:
                    order._id.toString(),

                userId:
                    userId.toString(),

                amount:
                    payment.amount,

                razorpayOrderId:
                    payment.razorpayOrderId,

                razorpayPaymentId:
                    payment.razorpayPaymentId

            }

        };


        await publishEvent(
            "payment.processed",
            paymentProcessedEvent
        );


        console.log(
            "================================="
        );

        console.log(
            "Razorpay Payment Verified"
        );

        console.log(
            "Payment ID:",
            razorpayPaymentId
        );

        console.log(
            "VELOCITY Order:",
            order._id.toString()
        );

        console.log(
            "PaymentProcessed event published"
        );

        console.log(
            "================================="
        );


        // ==================================
        // RESPONSE
        // ==================================

        return res.status(200).json({

            success: true,

            message:
                "Payment verified successfully",

            orderId:
                order._id

        });


    } catch (error) {

        console.error(
            "Payment Verification Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Payment verification failed"

        });

    }

};


module.exports = {

    createRazorpayOrder,

    verifyPayment

};