"use strict";

const { authenticateUser } = require("./authenticateUser");
const Member = require("../models/Member");

const authenticateAdmin = async (req, res, next) => {
    return authenticateUser(req, res, async () => {
        try {
            if (!req.user?.id) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden. Member access required."
                });
            }

            const member = await Member.findOne({
                where: { userId: req.user.id }
            });

            if (!member) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden. Member access required."
                });
            }

            req.member = member;
            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Invalid authentication context."
            });
        }
    });
};

module.exports = { authenticateAdmin };