const Product = require("../models/Product");

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Get Products Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
};

module.exports = {
    getProducts,
    getProductById
};