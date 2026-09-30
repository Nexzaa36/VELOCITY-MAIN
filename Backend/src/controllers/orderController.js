const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const crypto = require("crypto");

const {
    publishEvent
} = require("../messaging/eventPublisher");

const {
    advanceTracking,
    syncTrackingWithOrderStatus
} = require("../services/trackingService");

const createOrder = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.id ||
            req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID not found"
            });
        }

        console.log("=================================");
        console.log("CREATE ORDER");
        console.log("JWT User:", req.user);
        console.log("Using User ID:", userId);
        console.log("=================================");

        const cart = await Cart.findOne({
            userId
        });

        console.log("=================================");
        console.log("MONGODB CART FOR ORDER");
        console.log("User ID:", userId);
        console.log("Cart:", cart);
        console.log(
            "Cart Item Count:",
            cart?.items?.length || 0
        );
        console.log("=================================");

        if (
            !cart ||
            cart.items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const orderItems = [];
        let subtotal = 0;

        for (const item of cart.items) {
            const product =
                await Product.findById(
                    item.productId
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Product not found: ${item.productId}`
                });
            }

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid quantity for ${product.name}`
                });
            }

            if (
                quantity >
                product.stock
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient stock for ${product.name}`
                });
            }

            const price =
                Number(product.price);

            const itemTotal =
                price * quantity;

            subtotal += itemTotal;

            orderItems.push({
                productId:
                    product._id,
                quantity,
                price
            });
        }

        const tax =
            subtotal * 0.05;

        const totalAmount =
            subtotal + tax;

        const order =
            await Order.create({
                userId,
                items: orderItems,
                totalAmount,
                status: "PENDING",
                trackingStatus: "PLACED",
                trackingStatusChangedAt:
                    new Date(),
                trackingHistory: [
                    {
                        status: "PLACED",
                        changedAt: new Date()
                    }
                ]
            });

        console.log("=================================");
        console.log("VELOCITY ORDER CREATED");
        console.log("Order ID:", order._id);
        console.log("Subtotal:", subtotal);
        console.log("Tax:", tax);
        console.log("Total:", totalAmount);
        console.log(
            "Tracking Status:",
            order.trackingStatus
        );
        console.log("=================================");

        const orderCreatedEvent = {
            eventId:
                crypto.randomUUID(),
            eventType:
                "OrderCreated",
            timestamp:
                new Date().toISOString(),
            data: {
                orderId:
                    order._id.toString(),
                userId:
                    userId.toString(),
                items:
                    order.items.map(
                        item => ({
                            productId:
                                item.productId.toString(),
                            quantity:
                                item.quantity,
                            price:
                                item.price
                        })
                    ),
                subtotal,
                tax,
                totalAmount
            }
        };

        await publishEvent(
            "order.created",
            orderCreatedEvent
        );

        console.log(
            "OrderCreated event published"
        );

        return res.status(201).json({
            success: true,
            message:
                "Order created successfully",
            order: {
                _id:
                    order._id,
                userId:
                    order.userId,
                items:
                    order.items,
                subtotal,
                tax,
                totalAmount,
                status:
                    order.status,
                trackingStatus:
                    order.trackingStatus,
                trackingStatusChangedAt:
                    order.trackingStatusChangedAt,
                trackingHistory:
                    order.trackingHistory,
                createdAt:
                    order.createdAt
            }
        });
    } catch (error) {
        console.error(
            "Create order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create order",
            error:
                error.message
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId =
            req.user?.userId ||
            req.user?.id ||
            req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated user ID not found"
            });
        }

        const orders =
            await Order.find({
                userId
            })
                .populate(
                    "items.productId"
                )
                .sort({
                    createdAt: -1
                });

        for (const order of orders) {
            await syncTrackingWithOrderStatus(
                order
            );

            await advanceTracking(
                order
            );
        }

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error(
            "Get orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch orders",
            error:
                error.message
        });
    }
};

const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const userId =
            req.user?.userId ||
            req.user?.id ||
            req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated user ID not found"
            });
        }

        if (
            !/^[0-9a-fA-F]{24}$/.test(
                orderId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID. Use the MongoDB order ID."
            });
        }

        const order =
            await Order.findById(
                orderId
            ).populate(
                "items.productId"
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        if (
            order.userId &&
            order.userId.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to view this order"
            });
        }

        await syncTrackingWithOrderStatus(
            order
        );

        await advanceTracking(
            order
        );

        return res.status(200).json({
            success: true,
            order: {
                ...order.toObject(),
                trackingStatus:
                    order.trackingStatus,
                trackingStatusChangedAt:
                    order.trackingStatusChangedAt,
                trackingHistory:
                    order.trackingHistory
            }
        });
    } catch (error) {
        console.error(
            "Get order error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch order",
            error:
                error.message
        });
    }
};

// ========================================
// ADMIN - GET ALL ORDERS
// ========================================

const getAllOrdersForAdmin = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate("userId", "name email")
            .populate("items.productId", "name price image")
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {

        console.error(
            "Admin get orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin orders",
            error: error.message
        });

    }
};


// ========================================
// ADMIN - GET SINGLE ORDER
// ========================================

const getAdminOrderById = async (req, res) => {

    try {

        const { orderId } = req.params;

        if (
            !/^[0-9a-fA-F]{24}$/.test(orderId)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });

        }

        const order =
            await Order.findById(orderId)
                .populate(
                    "userId",
                    "name email"
                )
                .populate(
                    "items.productId",
                    "name price image"
                );

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {

        console.error(
            "Admin get order error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });

    }
};


// ========================================
// ADMIN - UPDATE TRACKING STATUS
// ========================================

const updateOrderTrackingStatus = async (req, res) => {

    try {

        const { orderId } = req.params;
        const { trackingStatus } = req.body;

        const allowedStatuses = [
            "PLACED",
            "PAID",
            "RESERVED",
            "CONFIRMED",
            "PREPARING",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED"
        ];

        if (
            !allowedStatuses.includes(
                trackingStatus
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid tracking status"
            });

        }

        if (
            !/^[0-9a-fA-F]{24}$/.test(orderId)
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
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

        // Don't create a new history entry
        // if status has not actually changed.
        if (
            order.trackingStatus !==
            trackingStatus
        ) {

            order.trackingStatus =
                trackingStatus;

            order.trackingStatusChangedAt =
                new Date();

            order.trackingHistory.push({
                status: trackingStatus,
                changedAt: new Date()
            });

            await order.save();

        }

        return res.status(200).json({
            success: true,
            message: "Tracking status updated successfully",
            order
        });

    } catch (error) {

        console.error(
            "Admin update tracking error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update tracking status",
            error: error.message
        });

    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    getAllOrdersForAdmin,
    getAdminOrderById,
    updateOrderTrackingStatus
};