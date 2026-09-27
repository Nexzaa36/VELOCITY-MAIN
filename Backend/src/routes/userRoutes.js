const express = require("express");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Protected profile route",
        userId: req.user.userId
    });
});

module.exports = router;