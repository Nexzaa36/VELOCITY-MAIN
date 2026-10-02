const mongoose = require("mongoose");

const eventLogSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        eventType: {
            type: String,
            required: true,
            index: true
        },

        routingKey: {
            type: String,
            required: true,
            index: true
        },

        orderId: {
            type: String,
            default: null,
            index: true
        },

        userId: {
            type: String,
            default: null,
            index: true
        },

        status: {
            type: String,
            enum: [
                "PUBLISHED",
                "FAILED"
            ],
            default: "PUBLISHED",
            index: true
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        error: {
            type: String,
            default: null
        },

        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "EventLog",
    eventLogSchema
);