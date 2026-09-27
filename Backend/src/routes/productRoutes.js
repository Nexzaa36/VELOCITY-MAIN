const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);

module.exports = router;