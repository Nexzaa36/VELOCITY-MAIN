const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");


// =========================================
// CREATE ORDER
// =========================================

const createOrder = async (req, res) => {

    try {

        const { userId } = req.params;

        const { customer } = req.body;


        console.log("=================================");
        console.log("CREATE ORDER");
        console.log("User ID:", userId);
        console.log("Customer:", customer);
        console.log("=================================");


        // =========================================
        // GET CART FROM MONGODB
        // =========================================

        const cart =
            await Cart.findOne({ userId });


        console.log(
            "MongoDB Cart:",
            cart
        );


        // =========================================
        // CHECK CART
        // =========================================

        if (
            !cart ||
            !cart.items ||
            cart.items.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Cart is empty"

            });

        }


        const orderItems = [];

        let totalAmount = 0;


        // =========================================
        // PROCESS EVERY CART ITEM
        // =========================================

        for (
            const cartItem of cart.items
        ) {

            console.log(
                "Processing cart item:",
                cartItem
            );


            // =====================================
            // PRODUCT ID
            // =====================================

            const productId =
                cartItem.productId;


            if (!productId) {

                console.error(
                    "Missing product ID:",
                    cartItem
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Product ID is missing from cart"

                });

            }


            // =====================================
            // QUANTITY
            // =====================================

            const quantity =
                Number(cartItem.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid product quantity"

                });

            }


            // =====================================
            // GET PRODUCT FROM MONGODB
            // =====================================

            const product =
                await Product.findById(
                    productId
                );


            if (!product) {

                return res.status(404).json({

                    success: false,

                    message:
                        "One or more products no longer exist"

                });

            }


            // =====================================
            // CHECK STOCK
            // =====================================

            if (
                quantity >
                product.stock
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        `Insufficient stock for ${product.name}`

                });

            }


            // =====================================
            // USE DATABASE PRICE
            // =====================================

            const price =
                Number(product.price);


            const itemTotal =
                price * quantity;


            // =====================================
            // ADD ORDER ITEM
            // =====================================

            orderItems.push({

                productId:
                    product._id,

                quantity,

                price

            });


            totalAmount +=
                itemTotal;

        }


        // =========================================
        // CREATE ORDER
        // =========================================

        const order =
            await Order.create({

                userId,

                items:
                    orderItems,

                totalAmount,

                status:
                    "PENDING"

            });


        // =========================================
        // CLEAR MONGODB CART
        // =========================================

        cart.items = [];

        await cart.save();


        console.log(
            "Order created:",
            order._id
        );

        console.log(
            "MongoDB cart cleared"
        );


        // =========================================
        // SUCCESS RESPONSE
        // =========================================

        return res.status(201).json({

            success: true,

            message:
                "Order created successfully",

            order

        });


    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "CREATE ORDER ERROR:"
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
                "Failed to create order",

            error:
                error.message

        });

    }

};


// =========================================
// GET USER ORDERS
// =========================================

const getUserOrders = async (req, res) => {

    try {

        const { userId } =
            req.params;


        const orders =
            await Order.find({ userId })
                .populate(
                    "items.productId"
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            success: true,

            count:
                orders.length,

            orders

        });

    } catch (error) {

        console.error(
            "Get Orders Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch orders"

        });

    }

};


// =========================================
// GET SINGLE ORDER
// =========================================

const getOrderById = async (req, res) => {

    try {

        const { orderId } =
            req.params;


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


        return res.status(200).json({

            success: true,

            order

        });

    } catch (error) {

        console.error(
            "Get Order Error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch order"

        });

    }

};


module.exports = {

    createOrder,

    getUserOrders,

    getOrderById

};