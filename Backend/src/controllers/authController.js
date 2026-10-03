const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/emailService");

// =========================================
// PASSWORD VALIDATION
// =========================================

function isValidPassword(password) {

    const passwordRegex =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/;

    return passwordRegex.test(password);
}


// =========================================
// REGISTER USER
// =========================================

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // =========================================
        // CHECK REQUIRED FIELDS
        // =========================================

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide name, email and password"

            });

        }


        // =========================================
        // CHECK PASSWORD
        // =========================================

        if (!isValidPassword(password)) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character."

            });

        }


        // =========================================
        // CHECK EXISTING USER
        // =========================================

        const existingUser =
            await User.findOne({ email });


        if (existingUser) {

            return res.status(400).json({

                success: false,

                message:
                    "User already exists"

            });

        }


        // =========================================
        // HASH PASSWORD
        // =========================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =========================================
        // CREATE USER
        // =========================================

        const user =
            await User.create({

                name,

                email,

                password:
                    hashedPassword

            });


        // =========================================
        // RESPONSE
        // =========================================

        res.status(201).json({

            success: true,

            message:
                "User registered successfully",

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email

            }

        });


    } catch (error) {

        console.error(
            "Registration Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Server error"

        });

    }

};


// =========================================
// LOGIN USER
// =========================================

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // =========================================
        // CHECK REQUIRED FIELDS
        // =========================================

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide email and password"

            });

        }


        // =========================================
        // FIND USER
        // =========================================

        const user =
            await User.findOne({ email });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // =========================================
        // CHECK PASSWORD
        // =========================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // =========================================
        // CREATE JWT
        // =========================================

        const token =
            jwt.sign(

                {
                    userId:
                        user._id
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }

            );


        // =========================================
        // LOGIN RESPONSE
        // =========================================

        res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id:
                    user._id,

                name:
                    user.name,

                email:
                    user.email

            }

        });


    } catch (error) {

        console.error(
            "Login Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Server error"

        });

    }

};

// =============================================
// FORGOT PASSWORD
// =============================================

const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide your email address"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        // -----------------------------------------
        // Security:
        // Don't reveal whether an email exists.
        // -----------------------------------------

        if (!user) {

            return res.status(200).json({
                success: true,
                message:
                    "If an account exists with this email, a password reset link has been sent."
            });
        }

        // -----------------------------------------
        // Generate secure random token
        // -----------------------------------------

        const resetToken =
            crypto.randomBytes(32).toString("hex");

        // Store only a hash of the token
        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // Token valid for 15 minutes
        user.resetPasswordToken =
            hashedToken;

        user.resetPasswordExpires =
            new Date(
                Date.now() + 15 * 60 * 1000
            );

        await user.save();

        // -----------------------------------------
        // Send reset email
        // -----------------------------------------

        await sendPasswordResetEmail(
            user.email,
            resetToken
        );

        return res.status(200).json({
            success: true,
            message:
                "If an account exists with this email, a password reset link has been sent."
        });

    } catch (error) {

        console.error(
            "Forgot Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to process password reset request"
        });
    }
};


// =============================================
// RESET PASSWORD
// =============================================

const resetPassword = async (req, res) => {

    try {

        const {
            token,
            password
        } = req.body;

        if (!token || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Reset token and new password are required"
            });
        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }

        // -----------------------------------------
        // Hash incoming token
        // -----------------------------------------

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

        // -----------------------------------------
        // Find valid token
        // -----------------------------------------

        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {
                    $gt: new Date()
                }
            });

        if (!user) {

            return res.status(400).json({
                success: false,
                message:
                    "Reset link is invalid or has expired"
            });
        }

        // -----------------------------------------
        // Hash new password
        // -----------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        user.password =
            hashedPassword;

        // -----------------------------------------
        // Invalidate reset token
        // -----------------------------------------

        user.resetPasswordToken = null;

        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message:
                "Password reset successful"
        });

    } catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset password"
        });
    }
};

// =========================================
// ADMIN LOGIN
// =========================================

const adminLogin = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // =========================================
        // CHECK REQUIRED FIELDS
        // =========================================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }

        // =========================================
        // FIND USER
        // =========================================

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // =========================================
        // CHECK ADMIN ROLE
        // =========================================

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Administrator access required"
            });
        }

        // =========================================
        // CHECK PASSWORD
        // =========================================

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials"
            });
        }

        // =========================================
        // CREATE ADMIN JWT
        // =========================================

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // =========================================
        // RESPONSE
        // =========================================

        return res.status(200).json({
            success: true,
            message: "Admin login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(
            "Admin Login Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
};