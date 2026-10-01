const express = require("express");
const { loginAdmin } = require("../controllers/adminAuthController");
const adminLoginRateLimiter = require("../middleware/adminLoginRateLimiter");

const router = express.Router();

router.post(
    "/login",
    adminLoginRateLimiter,
    loginAdmin
);

module.exports = router;