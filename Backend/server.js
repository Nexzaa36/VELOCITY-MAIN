const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");

const connectDB = require("./src/config/db");


const app = express();

const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "VELOCITY backend is running",
        database: "MongoDB"
    });
});

// ========================================
// START SERVER
// ========================================

const startServer = async () => {

    await connectDB();

    app.listen(PORT, () => {
        console.log(`
========================================
       VELOCITY BACKEND SERVER
========================================
Server running on:
http://localhost:${PORT}

Health check:
http://localhost:${PORT}/api/health
========================================
        `);
    });
};

startServer();