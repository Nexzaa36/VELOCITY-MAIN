const rateLimit = require("express-rate-limit");

const adminLoginRateLimiter = rateLimit({
    windowMs: 2 * 60 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many failed login attempts. Please try again after 2 hours."
    }
});

module.exports = adminLoginRateLimiter;