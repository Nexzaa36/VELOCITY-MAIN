const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const rateLimit = require("express-rate-limit");    

const {
    connectRabbitMQ
} = require("./src/messaging/rabbitmq");

const {
    startOrderCreatedConsumer
} = require("./src/messaging/orderCreatedConsumer");

const {
    startInventoryConsumer
} = require("./src/messaging/inventoryConsumer");

const connectDB = require("./src/config/db");



const app = express();

const PORT = process.env.PORT;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },

    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api/auth",authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

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

    await connectRabbitMQ();

    await startOrderCreatedConsumer();

    await startInventoryConsumer();


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