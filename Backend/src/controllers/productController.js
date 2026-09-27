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

const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            price,
            image,
            tags,
            sizes,
            description,
            stock
        } = req.body;

        // Required fields
        if (!name || !category || price === undefined || !image) {
            return res.status(400).json({
                success: false,
                message: "Name, category, price and image are required"
            });
        }

        // Validate price
        if (Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        // Validate stock
        if (stock !== undefined && Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock cannot be negative"
            });
        }

        // Generate numeric product ID
        const lastProduct = await Product.findOne().sort({ id: -1 });

        const nextId = lastProduct
            ? lastProduct.id + 1
            : 1;

        const product = await Product.create({
            id: nextId,
            name,
            category,
            price: Number(price),
            image,
            tags: Array.isArray(tags) ? tags : [],
            sizes: Array.isArray(sizes) ? sizes : [],
            description: description || "",
            stock: stock !== undefined ? Number(stock) : 0
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        console.error("Create Product Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create product"
        });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const {
            name,
            category,
            price,
            image,
            tags,
            sizes,
            description,
            stock
        } = req.body;

        if (name !== undefined) product.name = name;
        if (category !== undefined) product.category = category;
        if (price !== undefined) {
            if (Number(price) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price cannot be negative"
                });
            }

            product.price = Number(price);
        }

        if (image !== undefined) product.image = image;
        if (tags !== undefined) product.tags = tags;
        if (sizes !== undefined) product.sizes = sizes;
        if (description !== undefined) product.description = description;

        if (stock !== undefined) {
            if (Number(stock) < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Stock cannot be negative"
                });
            }

            product.stock = Number(stock);
        }

        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Update Product Error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update product"
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct
};