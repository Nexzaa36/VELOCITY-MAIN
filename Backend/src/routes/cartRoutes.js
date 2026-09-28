const express = require("express");

const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

const router = express.Router();


// =====================================
// GET USER CART
// =====================================

router.get(
    "/:userId",
    getCart
);


// =====================================
// ADD ITEM
// =====================================

router.post(
    "/:userId/items",
    addToCart
);


// =====================================
// UPDATE ITEM
// =====================================

router.put(
    "/:userId/items/:productId",
    updateCartItem
);


// =====================================
// REMOVE ITEM
// =====================================

router.delete(
    "/:userId/items/:productId",
    removeCartItem
);


// =====================================
// CLEAR CART
// =====================================

router.delete(
    "/:userId",
    clearCart
);


module.exports = router;