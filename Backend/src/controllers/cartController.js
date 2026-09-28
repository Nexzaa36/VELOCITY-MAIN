const Cart = require("../models/Cart");
const Product = require("../models/Product");


// =========================================
// GET CART
// =========================================

const getCart = async (req, res) => {

    try {

        // Get user ID from verified JWT
        const userId = req.user.userId;

        const cart = await Cart.findOne({ userId })
            .populate("items.productId");


        // No cart yet
        if (!cart) {

            return res.status(200).json({

                success: true,

                cart: {
                    userId,
                    items: []
                }

            });

        }


        res.status(200).json({

            success: true,

            cart

        });


    } catch (error) {

        console.error(
            "Get Cart Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message: "Failed to fetch cart"

        });

    }

};


// =========================================
// ADD TO CART
// =========================================

const addToCart = async (req, res) => {

    try {

        // Get user ID from verified JWT
        const userId = req.user.userId;

        const {
            productId,
            quantity = 1,
            size = null
        } = req.body;


        // =====================================
        // VALIDATE PRODUCT ID
        // =====================================

        if (!productId) {

            return res.status(400).json({

                success: false,

                message: "Product ID is required"

            });

        }


        const requestedQuantity =
            Number(quantity);


        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Quantity must be a positive integer"

            });

        }


        // =====================================
        // FIND PRODUCT
        // =====================================

        const product =
            await Product.findById(productId);


        if (!product) {

            return res.status(404).json({

                success: false,

                message: "Product not found"

            });

        }


        // =====================================
        // CHECK STOCK
        // =====================================

        if (product.stock <= 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Product is out of stock"

            });

        }


        if (requestedQuantity > product.stock) {

            return res.status(409).json({

                success: false,

                message:
                    `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`

            });

        }


        // =====================================
        // FIND OR CREATE CART
        // =====================================

        let cart =
            await Cart.findOne({ userId });


        if (!cart) {

            cart = new Cart({

                userId,

                items: []

            });

        }


        // =====================================
        // FIND EXISTING ITEM
        // =====================================

        const existingItem =
            cart.items.find(item =>

                item.productId.toString() ===
                    productId &&

                item.size === (size || null)

            );


        // =====================================
        // ITEM ALREADY EXISTS
        // =====================================

        if (existingItem) {

            const newQuantity =
                existingItem.quantity +
                requestedQuantity;


            if (newQuantity > product.stock) {

                return res.status(409).json({

                    success: false,

                    message:
                        `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`

                });

            }


            existingItem.quantity =
                newQuantity;


            // Update price in case product price changed
            existingItem.price =
                product.price;

        }


        // =====================================
        // NEW ITEM
        // =====================================

        else {

            cart.items.push({

                productId:
                    product._id,

                quantity:
                    requestedQuantity,

                price:
                    product.price,

                size:
                    size || null

            });

        }


        // =====================================
        // SAVE CART
        // =====================================

        await cart.save();


        // Populate products before returning
        await cart.populate(
            "items.productId"
        );


        res.status(200).json({

            success: true,

            message:
                "Product added to cart",

            cart

        });


    } catch (error) {

        console.error(
            "Add To Cart Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to add product to cart"

        });

    }

};


// =========================================
// UPDATE CART ITEM QUANTITY
// =========================================

const updateCartItem = async (req, res) => {

    try {

        const {
            productId
        } = req.params;

        // Get user ID from verified JWT
        const userId = req.user.userId;

        const {
            quantity,
            size = null
        } = req.body;


        const newQuantity =
            Number(quantity);


        if (
            !Number.isInteger(newQuantity) ||
            newQuantity < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Quantity must be a positive integer"

            });

        }


        // =====================================
        // FIND PRODUCT
        // =====================================

        const product =
            await Product.findById(productId);


        if (!product) {

            return res.status(404).json({

                success: false,

                message:
                    "Product not found"

            });

        }


        // =====================================
        // CHECK STOCK
        // =====================================

        if (newQuantity > product.stock) {

            return res.status(409).json({

                success: false,

                message:
                    `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`

            });

        }


        // =====================================
        // FIND CART
        // =====================================

        const cart =
            await Cart.findOne({ userId });


        if (!cart) {

            return res.status(404).json({

                success: false,

                message:
                    "Cart not found"

            });

        }


        // =====================================
        // FIND ITEM
        // =====================================

        const item =
            cart.items.find(cartItem =>

                cartItem.productId.toString() ===
                    productId &&

                cartItem.size === (size || null)

            );


        if (!item) {

            return res.status(404).json({

                success: false,

                message:
                    "Product is not in cart"

            });

        }


        item.quantity =
            newQuantity;

        item.price =
            product.price;


        await cart.save();


        await cart.populate(
            "items.productId"
        );


        res.status(200).json({

            success: true,

            message:
                "Cart quantity updated",

            cart

        });


    } catch (error) {

        console.error(
            "Update Cart Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to update cart"

        });

    }

};


// =========================================
// REMOVE CART ITEM
// =========================================

const removeCartItem = async (req, res) => {

    try {

        const {
            productId
        } = req.params;

        // Get user ID from verified JWT
        const userId = req.user.userId;

        const {
            size = null
        } = req.query;


        const cart =
            await Cart.findOne({ userId });


        if (!cart) {

            return res.status(404).json({

                success: false,

                message:
                    "Cart not found"

            });

        }


        const originalLength =
            cart.items.length;


        cart.items =
            cart.items.filter(item =>

                !(
                    item.productId.toString() ===
                        productId &&

                    item.size === (size || null)
                )

            );


        if (
            cart.items.length ===
            originalLength
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Product is not in cart"

            });

        }


        await cart.save();


        await cart.populate(
            "items.productId"
        );


        res.status(200).json({

            success: true,

            message:
                "Product removed from cart",

            cart

        });


    } catch (error) {

        console.error(
            "Remove Cart Item Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to remove cart item"

        });

    }

};


// =========================================
// CLEAR CART
// =========================================

const clearCart = async (req, res) => {

    try {

        // Get user ID from verified JWT
        const userId = req.user.userId;


        const cart =
            await Cart.findOne({ userId });


        if (!cart) {

            return res.status(200).json({

                success: true,

                message:
                    "Cart is already empty"

            });

        }


        cart.items = [];


        await cart.save();


        res.status(200).json({

            success: true,

            message:
                "Cart cleared successfully",

            cart

        });


    } catch (error) {

        console.error(
            "Clear Cart Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to clear cart"

        });

    }

};


module.exports = {

    getCart,

    addToCart,

    updateCartItem,

    removeCartItem,

    clearCart

};