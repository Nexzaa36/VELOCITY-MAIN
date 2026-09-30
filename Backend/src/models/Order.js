const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
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
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "Order must contain at least one item"
            }
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "FAILED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        trackingStatus: {
            type: String,
            enum: [
                "PLACED",
                "PAID",
                "RESERVED",
                "CONFIRMED",
                "PREPARING",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED"
            ],
            default: "PLACED"
        },

        trackingStatusChangedAt: {
            type: Date,
            default: Date.now
        },

        trackingHistory: [
            {
                status: {
                    type: String,
                    enum: [
                        "PLACED",
                        "PAID",
                        "RESERVED",
                        "CONFIRMED",
                        "PREPARING",
                        "SHIPPED",
                        "OUT_FOR_DELIVERY",
                        "DELIVERED"
                    ]
                },
                changedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;