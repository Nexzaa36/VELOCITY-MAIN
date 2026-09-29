const Razorpay = require("razorpay");
const crypto = require("crypto");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Cart = require("../models/Cart");

const { publishEvent } = require("../messaging/eventPublisher");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const getAuthenticatedUserId = (req) => {
    return (
        req.user?.userId ||
        req.user?.id ||
        req.user?._id ||
        null
    );
};

const publishPaymentFailedEvent = async ({
    payment,
    order,
    userId,
    reason
}) => {
    const paymentFailedEvent = {
        eventId: crypto.randomUUID(),
        eventType: "PaymentFailed",
        timestamp: new Date().toISOString(),
        data: {
            paymentId: String(payment._id),
            orderId: String(order._id),
            userId: String(userId),
            amount: payment.amount,
            reason
        }
    };

    await publishEvent(
        "payment.failed",
        paymentFailedEvent
    );

    console.log("PaymentFailed event published");
};

const createRazorpayOrder = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);

        console.log("CREATE RAZORPAY ORDER");
        console.log("Authenticated User ID:", userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID not found"
            });
        }

        if (
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET
        ) {
            return res.status(500).json({
                success: false,
                message: "Razorpay configuration is missing"
            });
        }

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            String(order.userId) !==
            String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to pay for this order"
            });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    `Order cannot be paid because its status is ${order.status}`
            });
        }

        const existingPayment =
            await Payment.findOne({ orderId });

        if (
            existingPayment &&
            existingPayment.status === "SUCCESS"
        ) {
            return res.status(400).json({
                success: false,
                message: "Order has already been paid"
            });
        }

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
                keyId: process.env.RAZORPAY_KEY_ID,
                razorpayOrderId:
                    existingPayment.razorpayOrderId,
                amount: Math.round(
                    Number(existingPayment.amount) * 100
                ),
                currency: "INR",
                velocityOrderId:
                    String(order._id),
                paymentId:
                    String(existingPayment._id)
            });
        }

        const totalAmount =
            Number(order.totalAmount);

        if (
            !Number.isFinite(totalAmount) ||
            totalAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        const amountInPaise =
            Math.round(totalAmount * 100);

        console.log(
            "Razorpay amount:",
            amountInPaise
        );

        const razorpayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: String(order._id),
                notes: {
                    velocityOrderId:
                        String(order._id),
                    userId: String(userId)
                }
            });

        console.log(
            "Razorpay Order ID:",
            razorpayOrder.id
        );

        console.log(
            "VELOCITY Order ID:",
            String(order._id)
        );

        const payment =
            await Payment.create({
                orderId: order._id,
                userId,
                amount: totalAmount,
                razorpayOrderId:
                    razorpayOrder.id,
                status: "PENDING"
            });

        console.log(
            "Payment record created:",
            String(payment._id)
        );

        return res.status(201).json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
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
            "Razorpay order creation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create Razorpay order",
            error: error.message
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const userId =
            getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated user ID not found"
            });
        }

        const {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = req.body;

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

        const order =
            await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

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

        if (payment.status === "SUCCESS") {
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

        const signaturePayload =
            `${payment.razorpayOrderId}|${razorpayPaymentId}`;

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(signaturePayload)
                .digest("hex");

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
            payment.status = "FAILED";
            await payment.save();

            await publishPaymentFailedEvent({
                payment,
                order,
                userId,
                reason:
                    "Invalid payment signature"
            });

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
            payment.status = "FAILED";
            await payment.save();

            await publishPaymentFailedEvent({
                payment,
                order,
                userId,
                reason:
                    "Invalid payment signature"
            });

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment signature"
            });
        }

        payment.razorpayPaymentId =
            razorpayPaymentId;

        payment.status = "SUCCESS";

        await payment.save();

        await Cart.deleteOne({
            userId
        });

        console.log(
            "Cart cleared after successful payment"
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

        const paymentProcessedEvent = {
            eventId: crypto.randomUUID(),
            eventType: "PaymentProcessed",
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
            "Payment verification error:",
            error
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

const reportPaymentFailure = async (
    req,
    res
) => {
    try {
        const userId =
            getAuthenticatedUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated user ID not found"
            });
        }

        const {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            reason
        } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message:
                    "Order ID is required"
            });
        }

        const order =
            await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        if (
            String(order.userId) !==
            String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to report this payment"
            });
        }

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

        if (payment.status === "SUCCESS") {
            return res.status(400).json({
                success: false,
                message:
                    "Payment was already successful"
            });
        }

        if (payment.status === "FAILED") {
            return res.status(200).json({
                success: true,
                message:
                    "Payment failure already processed",
                orderId:
                    String(order._id),
                paymentId:
                    String(payment._id),
                status:
                    payment.status
            });
        }

        if (razorpayOrderId) {
            payment.razorpayOrderId =
                razorpayOrderId;
        }

        if (razorpayPaymentId) {
            payment.razorpayPaymentId =
                razorpayPaymentId;
        }

        payment.status = "FAILED";

        await payment.save();

        await publishPaymentFailedEvent({
            payment,
            order,
            userId,
            reason:
                reason ||
                "Razorpay payment failed"
        });

        console.log(
            "Payment failure processed:",
            String(order._id)
        );

        return res.status(200).json({
            success: true,
            message:
                "Payment failure processed",
            orderId:
                String(order._id),
            paymentId:
                String(payment._id),
            status:
                payment.status
        });
    } catch (error) {
        console.error(
            "Payment failure error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process payment failure",
            error:
                error.message
        });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyPayment,
    reportPaymentFailure
};