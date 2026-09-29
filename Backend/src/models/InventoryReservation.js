const mongoose = require("mongoose");

const reservationItemSchema = new mongoose.Schema(
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
        }
    },
    {
        _id: false
    }
);


const inventoryReservationSchema = new mongoose.Schema(
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

        items: {
            type: [reservationItemSchema],
            required: true,

            validate: {
                validator: function (items) {
                    return items.length > 0;
                },

                message:
                    "Reservation must contain at least one item"
            }
        },

        status: {
            type: String,

            enum: [
                "RESERVED",
                "RELEASED",
                "FAILED"
            ],

            default: "RESERVED"
        }
    },

    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "InventoryReservation",
    inventoryReservationSchema
);