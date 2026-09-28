const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");


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


module.exports = {

    registerUser,

    loginUser

};