const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../src/models/User");

const ADMIN_EMAIL = "admin@velocity.com";
const NEW_PASSWORD = "Admin@12345";

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const admin = await User.findOne({
            email: ADMIN_EMAIL
        });

        if (!admin) {
            console.log("Admin account not found.");
            await mongoose.disconnect();
            return;
        }

        if (admin.role !== "admin") {
            console.log("This account is not an admin.");
            console.log(`Current role: ${admin.role}`);

            await mongoose.disconnect();
            return;
        }

        admin.password = await bcrypt.hash(
            NEW_PASSWORD,
            10
        );

        await admin.save();

        console.log("----------------------------------------");
        console.log("ADMIN PASSWORD RESET SUCCESSFULLY");
        console.log("----------------------------------------");
        console.log(`Email:    ${ADMIN_EMAIL}`);
        console.log(`Password: ${NEW_PASSWORD}`);
        console.log("----------------------------------------");

        await mongoose.disconnect();

    } catch (error) {
        console.error("Password reset failed:");
        console.error(error.message);

        await mongoose.disconnect();
        process.exit(1);
    }
};

resetAdminPassword();