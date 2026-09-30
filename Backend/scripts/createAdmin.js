const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../src/models/User");

const ADMIN_EMAIL = "admin@velocity.com";
const ADMIN_PASSWORD = "Admin@12345";

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL
        });

        if (existingAdmin) {
            console.log("Admin account already exists.");
            console.log(`Email: ${ADMIN_EMAIL}`);

            await mongoose.disconnect();
            return;
        }

        const hashedPassword = await bcrypt.hash(
            ADMIN_PASSWORD,
            10
        );

        const admin = await User.create({
            name: "Velocity Administrator",
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin"
        });

        console.log("----------------------------------------");
        console.log("ADMIN ACCOUNT CREATED");
        console.log("----------------------------------------");
        console.log(`Email:    ${admin.email}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        console.log("----------------------------------------");

        await mongoose.disconnect();

    } catch (error) {
        console.error("Admin creation failed:");
        console.error(error.message);

        await mongoose.disconnect();
        process.exit(1);
    }
};

createAdmin();