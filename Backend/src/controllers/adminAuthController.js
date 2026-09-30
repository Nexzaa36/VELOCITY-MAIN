const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        const admin = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        if (admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access denied"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        const token = jwt.sign(
            {
                userId: admin._id,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    loginAdmin
};