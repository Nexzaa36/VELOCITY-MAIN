const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const adminProtect = require("../middleware/adminMiddleware");

const router = express.Router();

// Public product routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin product management routes
router.post("/", adminProtect, createProduct);
router.put("/:id", adminProtect, updateProduct);
router.delete("/:id", adminProtect, deleteProduct);

module.exports = router;