const express = require("express");

const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

const router = express.Router();


// Get user's cart
router.get("/:userId", getCart);


// Add product to cart
router.post("/:userId/items", addToCart);


// Update product quantity
router.put(
    "/:userId/items/:productId",
    updateCartItem
);


// Remove product from cart
router.delete(
    "/:userId/items/:productId",
    removeCartItem
);


// Clear cart
router.delete(
    "/:userId",
    clearCart
);


module.exports = router;