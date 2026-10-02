const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
require("dotenv").config();

const authRoutes =require("./src/routes/authRoutes");

const userRoutes =require("./src/routes/userRoutes");

const productRoutes =require("./src/routes/productRoutes");

const cartRoutes =require("./src/routes/cartRoutes");

const orderRoutes =require("./src/routes/orderRoutes");

const rateLimit =require("express-rate-limit");

const paymentRoutes =require("./src/routes/paymentRoutes");

const adminAuthRoutes = require("./src/routes/adminAuthRoutes");

const adminObservabilityRoutes =require("./src/routes/adminObservabilityRoutes");

// ========================================
// RABBITMQ
// ========================================

const {
    connectRabbitMQ
} = require("./src/messaging/rabbitmq");


// ========================================
// ORDER CREATED CONSUMER
// ========================================

const {
    startOrderCreatedConsumer
} = require("./src/messaging/orderCreatedConsumer");


// ========================================
// INVENTORY CONSUMER
// ========================================

const {
    startInventoryConsumer
} = require("./src/messaging/inventoryConsumer");


// ========================================
// INVENTORY RESERVED CONSUMER
// ========================================

const {
    startInventoryReservedConsumer
} = require("./src/messaging/inventoryReservedConsumer");


// ========================================
// DATABASE
// ========================================

const connectDB =
    require("./src/config/db");


// ========================================
// PAYMENT CONSUMER
// ========================================

const {
    startPaymentConsumer
} = require("./src/messaging/paymentConsumer");


// ========================================
// PAYMENT PROCESSED CONSUMER
// ========================================

const {
    startPaymentProcessedConsumer
} = require("./src/messaging/paymentProcessedConsumer");


// ========================================
// PAYMENT FAILED CONSUMER
// ========================================

const {
    startPaymentFailedConsumer
} = require("./src/messaging/paymentFailedConsumer");

const {
    startPaymentFailedInventoryConsumer
} = require("./src/messaging/paymentFailedInventoryConsumer");

const {
    startNotificationConsumer
} = require("./src/messaging/notificationConsumer");

// ========================================
// EXPRESS APP
// ========================================

const app =
    express();

const PORT = process.env.PORT;


// ========================================
// MIDDLEWARE
// ========================================
app.disable("x-powered-by");

app.use(helmet());
app.use(cors());
app.use(express.json());


// ========================================
// AUTH RATE LIMITER
// ========================================

const authLimiter =
    rateLimit({

        windowMs:
            15 * 60 * 1000,

        max:
            10,

        message: {

            success:
                false,

            message:
                "Too many requests. Please try again later."

        },

        standardHeaders:
            true,

        legacyHeaders:
            false

    });


// ========================================
// API ROUTES
// ========================================

app.use(
    "/api/auth",
    authLimiter,
    authRoutes
);

app.use("/api/admin/auth", adminAuthRoutes);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/admin/observability",
    adminObservabilityRoutes
);

// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({

            success:
                true,

            message:
                "VELOCITY backend is running",

            database:
                "MongoDB"

        });

    }
);


// ========================================
// START SERVER
// ========================================

const startServer =
    async () => {

        await connectDB();

        await connectRabbitMQ();


        // ========================================
        // START ORDER CREATED CONSUMER
        // ========================================

        await startOrderCreatedConsumer();


        // ========================================
        // START INVENTORY CONSUMER
        // ========================================

        await startInventoryConsumer();

        await startInventoryReservedConsumer();

        await startPaymentConsumer();

        await startPaymentProcessedConsumer();

        await startPaymentFailedConsumer();

        await startPaymentFailedInventoryConsumer();

        await startNotificationConsumer();

        app.listen(
            PORT,
            () => {

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

            }
        );

    };


startServer();