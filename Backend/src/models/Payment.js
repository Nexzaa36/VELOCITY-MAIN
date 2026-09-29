const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,

            enum: [
                "PENDING",
                "SUCCESS",
                "FAILED"
            ],

            default: "PENDING"
        },

        razorpayOrderId: {
            type: String,
            default: null
        },

        razorpayPaymentId: {
            type: String,
            default: null
        }
    },

    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "Payment",
        paymentSchema
    );