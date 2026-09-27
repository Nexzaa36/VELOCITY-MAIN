const Cart = require("../models/Cart");
const Product = require("../models/Product");


// =========================================
// GET CART
// =========================================

const getCart = async (req, res) => {

    try {

        const { userId } = req.params;

        const cart = await Cart.findOne({ userId })
            .populate("items.productId");

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

        const { userId } = req.params;

        const {
            productId,
            quantity = 1
        } = req.body;


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
                message: "Quantity must be a positive integer"
            });

        }


        // Find product
        const product =
            await Product.findById(productId);


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }


        // Check current stock
        if (product.stock <= 0) {

            return res.status(409).json({
                success: false,
                message: "Product is out of stock"
            });

        }


        // Find or create cart
        let cart =
            await Cart.findOne({ userId });


        if (!cart) {

            cart = new Cart({
                userId,
                items: []
            });

        }


        // Check whether product already exists
        const existingItem =
            cart.items.find(
                item =>
                    item.productId.toString() ===
                    productId
            );


        if (existingItem) {

            const newQuantity =
                existingItem.quantity +
                requestedQuantity;


            // Do not allow cart quantity
            // to exceed current stock
            if (newQuantity > product.stock) {

                return res.status(409).json({
                    success: false,
                    message:
                        `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`
                });

            }


            existingItem.quantity =
                newQuantity;

        } else {

            // First item addition
            if (requestedQuantity > product.stock) {

                return res.status(409).json({
                    success: false,
                    message:
                        `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`
                });

            }


            cart.items.push({

                productId: product._id,

                quantity: requestedQuantity,

                price: product.price

            });

        }


        await cart.save();


        // Return updated cart
        await cart.populate(
            "items.productId"
        );


        res.status(200).json({

            success: true,

            message: "Product added to cart",

            cart

        });

    } catch (error) {

        console.error(
            "Add To Cart Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to add product to cart"
        });

    }

};


// =========================================
// UPDATE CART ITEM QUANTITY
// =========================================

const updateCartItem = async (req, res) => {

    try {

        const {
            userId,
            productId
        } = req.params;

        const { quantity } = req.body;


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


        const product =
            await Product.findById(productId);


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }


        if (newQuantity > product.stock) {

            return res.status(409).json({
                success: false,
                message:
                    `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`
            });

        }


        const cart =
            await Cart.findOne({ userId });


        if (!cart) {

            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });

        }


        const item =
            cart.items.find(
                cartItem =>
                    cartItem.productId.toString() ===
                    productId
            );


        if (!item) {

            return res.status(404).json({
                success: false,
                message: "Product is not in cart"
            });

        }


        item.quantity =
            newQuantity;


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
            userId,
            productId
        } = req.params;


        const cart =
            await Cart.findOne({ userId });


        if (!cart) {

            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });

        }


        const originalLength =
            cart.items.length;


        cart.items =
            cart.items.filter(
                item =>
                    item.productId.toString() !==
                    productId
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

        const { userId } = req.params;


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