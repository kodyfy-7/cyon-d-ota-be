"use strict";

const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Missing or invalid token."
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Invalid or expired token."
        });
    }
};

module.exports = { authenticateUser };