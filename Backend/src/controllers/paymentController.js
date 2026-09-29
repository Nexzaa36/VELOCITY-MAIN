const Razorpay = require("razorpay");
const crypto = require("crypto");

const Order =
    require("../models/Order");

const Payment =
    require("../models/Payment");

const {
    publishEvent
} = require("../messaging/eventPublisher");


// ========================================
// RAZORPAY CLIENT
// ========================================

const razorpay =
    new Razorpay({

        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_KEY_SECRET

    });


// ========================================
// GET AUTHENTICATED USER ID
// ========================================

const getAuthenticatedUserId = (req) => {

    return (
        req.user?.userId ||
        req.user?.id ||
        req.user?._id ||
        null
    );

};


// ========================================
// CREATE RAZORPAY ORDER
// ========================================

const createRazorpayOrder = async (
    req,
    res
) => {

    try {

        // ========================================
        // AUTHENTICATED USER
        // ========================================

        const userId =
            getAuthenticatedUserId(req);


        console.log(
            "================================="
        );

        console.log(
            "CREATE RAZORPAY ORDER"
        );

        console.log(
            "Authenticated User ID:",
            userId
        );

        console.log(
            "================================="
        );


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user ID not found"

            });

        }


        // ========================================
        // RAZORPAY ENVIRONMENT CHECK
        // ========================================

        if (
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "Razorpay configuration is missing"

            });

        }


        // ========================================
        // GET ORDER ID
        // ========================================

        const {
            orderId
        } = req.body;


        if (!orderId) {

            return res.status(400).json({

                success: false,

                message:
                    "Order ID is required"

            });

        }


        // ========================================
        // FIND VELOCITY ORDER
        // ========================================

        const order =
            await Order.findById(
                orderId
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        // ========================================
        // SECURITY CHECK
        // ========================================

        const orderUserId =
            String(order.userId);

        const authenticatedUserId =
            String(userId);


        if (
            orderUserId !==
            authenticatedUserId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to pay for this order"

            });

        }


        // ========================================
        // ORDER STATUS CHECK
        // ========================================

        if (
            order.status !==
            "PENDING"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Order cannot be paid because its status is ${order.status}`

            });

        }


        // ========================================
        // CHECK EXISTING PAYMENT
        // ========================================

        const existingPayment =
            await Payment.findOne({

                orderId

            });


        // ========================================
        // ALREADY PAID
        // ========================================

        if (
            existingPayment &&
            existingPayment.status ===
                "SUCCESS"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Order has already been paid"

            });

        }


        // ========================================
        // RETURN EXISTING RAZORPAY ORDER
        // ========================================

        if (
            existingPayment &&
            existingPayment.razorpayOrderId
        ) {

            console.log(
                "Using existing Razorpay order:",
                existingPayment.razorpayOrderId
            );


            return res.status(200).json({

                success: true,

                keyId:
                    process.env.RAZORPAY_KEY_ID,

                razorpayOrderId:
                    existingPayment.razorpayOrderId,

                amount:
                    Math.round(
                        Number(
                            existingPayment.amount
                        ) * 100
                    ),

                currency:
                    "INR",

                velocityOrderId:
                    String(order._id),

                paymentId:
                    String(existingPayment._id)

            });

        }


        // ========================================
        // CALCULATE AMOUNT
        // ========================================

        const totalAmount =
            Number(
                order.totalAmount
            );


        if (
            !Number.isFinite(
                totalAmount
            ) ||
            totalAmount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid order amount"

            });

        }


        const amountInPaise =
            Math.round(
                totalAmount * 100
            );


        console.log(
            "================================="
        );

        console.log(
            "Razorpay amount calculation"
        );

        console.log(
            "VELOCITY amount:",
            totalAmount
        );

        console.log(
            "Razorpay amount:",
            amountInPaise
        );

        console.log(
            "================================="
        );


        // ========================================
        // CREATE RAZORPAY ORDER
        // ========================================

        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    amountInPaise,

                currency:
                    "INR",

                receipt:
                    String(order._id),

                notes: {

                    velocityOrderId:
                        String(order._id),

                    userId:
                        String(userId)

                }

            });


        console.log(
            "================================="
        );

        console.log(
            "RAZORPAY ORDER CREATED"
        );

        console.log(
            "Razorpay Order ID:",
            razorpayOrder.id
        );

        console.log(
            "VELOCITY Order ID:",
            String(order._id)
        );

        console.log(
            "Amount:",
            totalAmount
        );

        console.log(
            "Amount in Paise:",
            amountInPaise
        );

        console.log(
            "================================="
        );


        // ========================================
        // SAVE PAYMENT
        // ========================================

        const payment =
            await Payment.create({

                orderId:
                    order._id,

                userId:
                    userId,

                amount:
                    totalAmount,

                razorpayOrderId:
                    razorpayOrder.id,

                status:
                    "PENDING"

            });


        console.log(
            "Payment record created:",
            String(payment._id)
        );


        // ========================================
        // RESPONSE
        // ========================================

        return res.status(201).json({

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
                String(order._id),

            paymentId:
                String(payment._id)

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "RAZORPAY ORDER CREATION ERROR"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to create Razorpay order",

            error:
                error.message

        });

    }

};


// ========================================
// VERIFY RAZORPAY PAYMENT
// ========================================

const verifyPayment = async (
    req,
    res
) => {

    try {

        // ========================================
        // AUTHENTICATED USER
        // ========================================

        const userId =
            getAuthenticatedUserId(req);


        if (!userId) {

            return res.status(401).json({

                success: false,

                message:
                    "Authenticated user ID not found"

            });

        }


        // ========================================
        // REQUEST DATA
        // ========================================

        const {

            orderId,

            razorpayOrderId,

            razorpayPaymentId,

            razorpaySignature

        } = req.body;


        // ========================================
        // VALIDATE INPUT
        // ========================================

        if (
            !orderId ||
            !razorpayOrderId ||
            !razorpayPaymentId ||
            !razorpaySignature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Missing payment verification details"

            });

        }


        // ========================================
        // FIND ORDER
        // ========================================

        const order =
            await Order.findById(
                orderId
            );


        if (!order) {

            return res.status(404).json({

                success: false,

                message:
                    "Order not found"

            });

        }


        // ========================================
        // OWNERSHIP CHECK
        // ========================================

        if (
            String(order.userId) !==
            String(userId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to verify this payment"

            });

        }


        // ========================================
        // FIND PAYMENT
        // ========================================

        const payment =
            await Payment.findOne({

                orderId

            });


        if (!payment) {

            return res.status(404).json({

                success: false,

                message:
                    "Payment record not found"

            });

        }


        // ========================================
        // CHECK RAZORPAY ORDER ID
        // ========================================

        if (
            payment.razorpayOrderId !==
            razorpayOrderId
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Razorpay order ID does not match"

            });

        }


        // ========================================
        // ALREADY VERIFIED
        // ========================================

        if (
            payment.status ===
            "SUCCESS"
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "Payment already verified",

                orderId:
                    String(order._id),

                paymentId:
                    String(payment._id),

                status:
                    payment.status

            });

        }


        // ========================================
        // GENERATE SIGNATURE
        // ========================================

        const signaturePayload =
            `${payment.razorpayOrderId}|${razorpayPaymentId}`;


        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    signaturePayload
                )
                .digest("hex");


        // ========================================
        // TIMING SAFE COMPARISON
        // ========================================

        const expectedBuffer =
            Buffer.from(
                generatedSignature,
                "utf8"
            );


        const receivedBuffer =
            Buffer.from(
                razorpaySignature,
                "utf8"
            );


        if (
            expectedBuffer.length !==
            receivedBuffer.length
        ) {

            payment.status =
                "FAILED";

            await payment.save();


            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature"

            });

        }


        const signatureValid =
            crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            );


        if (!signatureValid) {

            payment.status =
                "FAILED";

            await payment.save();


            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature"

            });

        }


        // ========================================
        // SAVE SUCCESSFUL PAYMENT
        // ========================================

        payment.razorpayPaymentId =
            razorpayPaymentId;

        payment.status =
            "SUCCESS";


        await payment.save();


        console.log(
            "================================="
        );

        console.log(
            "RAZORPAY PAYMENT VERIFIED"
        );

        console.log(
            "Payment ID:",
            razorpayPaymentId
        );

        console.log(
            "Razorpay Order ID:",
            razorpayOrderId
        );

        console.log(
            "VELOCITY Order ID:",
            String(order._id)
        );

        console.log(
            "Amount:",
            payment.amount
        );

        console.log(
            "================================="
        );


        // ========================================
        // PUBLISH PAYMENT PROCESSED
        // ========================================

        const paymentProcessedEvent = {

            eventId:
                crypto.randomUUID(),

            eventType:
                "PaymentProcessed",

            timestamp:
                new Date().toISOString(),

            data: {

                paymentId:
                    String(payment._id),

                orderId:
                    String(order._id),

                userId:
                    String(userId),

                amount:
                    payment.amount,

                razorpayPaymentId:
                    payment.razorpayPaymentId

            }

        };


        await publishEvent(
            "payment.processed",
            paymentProcessedEvent
        );


        console.log(
            "PaymentProcessed event published"
        );


        // ========================================
        // RESPONSE
        // ========================================

        return res.status(200).json({

            success: true,

            message:
                "Payment verified successfully",

            orderId:
                String(order._id),

            paymentId:
                String(payment._id),

            status:
                payment.status

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "PAYMENT VERIFICATION ERROR"
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "Payment verification failed",

            error:
                error.message

        });

    }

};


// ========================================
// EXPORT
// ========================================

module.exports = {

    createRazorpayOrder,

    verifyPayment

};