const Cart = require("../models/Cart");
const Product = require("../models/Product");

// =========================================
// GET CART
// =========================================

const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;

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
        console.error("Get Cart Error:", error.message);

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
        const userId = req.user.userId;

        const {
            productId,
            quantity = 1,
            size = null
        } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const requestedQuantity = Number(quantity);

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.stock <= 0) {
            return res.status(409).json({
                success: false,
                message: "Product is out of stock"
            });
        }

        if (requestedQuantity > product.stock) {
            return res.status(409).json({
                success: false,
                message: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: []
            });
        }

        // Calculate total quantity of this product already in the cart.
        // This includes different sizes.
        const existingProductQuantity = cart.items
            .filter(item =>
                item.productId.toString() === productId
            )
            .reduce(
                (total, item) => total + item.quantity,
                0
            );

        const totalRequestedQuantity =
            existingProductQuantity + requestedQuantity;

        if (totalRequestedQuantity > product.stock) {
            const remaining =
                product.stock - existingProductQuantity;

            if (remaining <= 0) {
                return res.status(409).json({
                    success: false,
                    message: `You already have the maximum available stock of ${product.name} in your cart`
                });
            }

            return res.status(409).json({
                success: false,
                message: `Only ${remaining} more unit${remaining === 1 ? "" : "s"} of ${product.name} available`
            });
        }

        const existingItem = cart.items.find(item =>
            item.productId.toString() === productId &&
            item.size === (size || null)
        );

        if (existingItem) {
            existingItem.quantity += requestedQuantity;
            existingItem.price = product.price;
        } else {
            cart.items.push({
                productId: product._id,
                quantity: requestedQuantity,
                price: product.price,
                size: size || null
            });
        }

        await cart.save();

        await cart.populate("items.productId");

        res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart
        });
    } catch (error) {
        console.error("Add To Cart Error:", error.message);

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
        const { productId } = req.params;
        const userId = req.user.userId;

        const {
            quantity,
            size = null
        } = req.body;

        const newQuantity = Number(quantity);

        if (
            !Number.isInteger(newQuantity) ||
            newQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive integer"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(cartItem =>
            cartItem.productId.toString() === productId &&
            cartItem.size === (size || null)
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product is not in cart"
            });
        }

        // Quantity of this product in all other cart lines.
        const otherProductQuantity = cart.items
            .filter(cartItem =>
                cartItem.productId.toString() === productId &&
                cartItem !== item
            )
            .reduce(
                (total, cartItem) => total + cartItem.quantity,
                0
            );

        const totalRequestedQuantity =
            otherProductQuantity + newQuantity;

        if (totalRequestedQuantity > product.stock) {
            const availableForThisItem =
                product.stock - otherProductQuantity;

            return res.status(409).json({
                success: false,
                message:
                    `Only ${Math.max(availableForThisItem, 0)} unit${Math.max(availableForThisItem, 0) === 1 ? "" : "s"} available for this product`
            });
        }

        item.quantity = newQuantity;
        item.price = product.price;

        await cart.save();

        await cart.populate("items.productId");

        res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart
        });
    } catch (error) {
        console.error("Update Cart Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update cart"
        });
    }
};

// =========================================
// REMOVE CART ITEM
// =========================================

const removeCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.userId;

        const { size = null } = req.query;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const originalLength = cart.items.length;

        cart.items = cart.items.filter(item =>
            !(
                item.productId.toString() === productId &&
                item.size === (size || null)
            )
        );

        if (cart.items.length === originalLength) {
            return res.status(404).json({
                success: false,
                message: "Product is not in cart"
            });
        }

        await cart.save();

        await cart.populate("items.productId");

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });
    } catch (error) {
        console.error("Remove Cart Item Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to remove cart item"
        });
    }
};

// =========================================
// CLEAR CART
// =========================================

const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is already empty"
            });
        }

        cart.items = [];

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });
    } catch (error) {
        console.error("Clear Cart Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to clear cart"
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