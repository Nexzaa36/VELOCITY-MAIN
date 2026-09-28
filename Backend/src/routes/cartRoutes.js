const express = require("express");
const protect = require("../middleware/authMiddleware");

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
    protect,
    getCart
);


// =====================================
// ADD ITEM
// =====================================

router.post(
    "/:userId/items",
    protect,
    addToCart
);


// =====================================
// UPDATE ITEM
// =====================================

router.put(
    "/:userId/items/:productId",
    protect,
    updateCartItem
);


// =====================================
// REMOVE ITEM
// =====================================

router.delete(
    "/:userId/items/:productId",
    protect,
    removeCartItem
);


// =====================================
// CLEAR CART
// =====================================

router.delete(
    "/:userId",
    protect,
    clearCart
);


module.exports = router;