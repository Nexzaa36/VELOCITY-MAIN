const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        resetPasswordToken: {
            type: String,
            default: null
        },

        resetPasswordExpires: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;