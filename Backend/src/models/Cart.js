const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        size: {
            type: String,
            default: null
        }
    },
    {
        _id: false
    }
);

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true
        },

        items: {
            type: [cartItemSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;