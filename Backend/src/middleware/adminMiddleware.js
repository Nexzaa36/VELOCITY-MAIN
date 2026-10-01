const jwt = require("jsonwebtoken");

const adminProtect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            decoded.role !== "admin" ||
            decoded.tokenType !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access denied"
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {
        console.error(
            "Admin Middleware Error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });
    }
};

module.exports = adminProtect;