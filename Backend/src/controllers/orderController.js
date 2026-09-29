const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const crypto = require("crypto");

const {
    publishEvent
} = require("../messaging/eventPublisher");


// ========================================
// CREATE ORDER
// ========================================

const createOrder = async (req, res) => {

    try {

        const userId =
            req.user.id ||
            req.user.userId ||
            req.user._id;

        console.log(
            "================================="
        );

        console.log(
            "CREATE ORDER"
        );

        console.log(
            "JWT User:",
            req.user
        );

        console.log(
            "Using User ID:",
            userId
        );

        console.log(
            "================================="
        );

        const {
            customer
        } = req.body;


        // ========================================
        // FIND CART
        // ========================================

        const cart =
            await Cart.findOne({
                userId
            });

        console.log(
            "================================="
        );

        console.log(
            "MONGODB CART FOR ORDER"
        );

        console.log(
            "User ID:",
            userId
        );

        console.log(
            "Cart:",
            cart
        );

        console.log(
            "Cart Item Count:",
            cart?.items?.length || 0
        );

        console.log(
            "================================="
        );


        if (!cart || cart.items.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Cart is empty"
            });
        }


        // ========================================
        // BUILD ORDER ITEMS
        // ========================================

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


            // ========================================
            // STOCK CHECK
            // ========================================

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


            // ========================================
            // USE DATABASE PRICE
            // ========================================

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


        // ========================================
        // TAX
        // ========================================

        const tax =
            subtotal * 0.05;


        // ========================================
        // FINAL TOTAL
        // ========================================

        const totalAmount =
            subtotal + tax;


        // ========================================
        // CREATE ORDER
        // ========================================

        const order =
            await Order.create({

                userId,

                items:
                    orderItems,

                totalAmount,

                status:
                    "PENDING"
            });


        console.log(
            "================================="
        );

        console.log(
            "VELOCITY ORDER CREATED"
        );

        console.log(
            "Order ID:",
            order._id
        );

        console.log(
            "Subtotal:",
            subtotal
        );

        console.log(
            "Tax:",
            tax
        );

        console.log(
            "Total:",
            totalAmount
        );

        console.log(
            "================================="
        );


        // ========================================
        // ORDER CREATED EVENT
        // ========================================

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
                        (item) => ({

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


        // ========================================
        // PUBLISH EVENT
        // ========================================

        await publishEvent(
            "order.created",
            orderCreatedEvent
        );


        console.log(
            "OrderCreated event published"
        );


        /*
         * IMPORTANT:
         *
         * The cart is NOT deleted here.
         *
         * The user has only created an order.
         * Payment has not been completed yet.
         *
         * The cart will be cleared after
         * successful Razorpay payment verification
         * inside paymentController.js.
         */


        // ========================================
        // RESPONSE
        // ========================================

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


// ========================================
// GET USER ORDERS
// ========================================

const getUserOrders = async (req, res) => {

    try {

        const userId =
            req.user.id;


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


// ========================================
// GET SINGLE ORDER
// ========================================

const getOrderById = async (req, res) => {

    try {

        const {
            orderId
        } = req.params;

        const userId =
            req.user.id;


        const order =
            await Order.findById(
                orderId
            )
                .populate(
                    "items.productId"
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
            order.userId.toString() !==
            userId.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not allowed to view this order"
            });
        }


        return res.status(200).json({

            success: true,

            order
        });


    } catch (error) {

        console.error(
            "Get order error:",
            error
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


module.exports = {

    createOrder,

    getUserOrders,

    getOrderById
};