"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const errorHandler = require("../../middleware/errorHandler");
const postgresDb = require("../../database/PostgresDb");
const User = require("../../models/User");
const Member = require("../../models/Member");
const Position = require("../../models/Position");
const Parish = require("../../models/Parish");

const SALT_ROUNDS = 10;

const signAccessToken = (user) =>
    jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

const signRefreshToken = (user) =>
    jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" }
    );

exports.register = async (req, res) => {
    const transaction = await postgresDb.transaction();
    try {
        const {
            name,
            email,
            password,
            phoneNumber,
            parishId,
            positionId,
            gender,
            dateOfBirth
        } = req.body;

        const [existing, position, parish] = await Promise.all([
            User.findOne({ where: { email }, transaction }),
            Position.findOne({ where: { id: positionId }, transaction }),
            Parish.findOne({ where: { id: parishId }, transaction })
        ]);

        if (existing) {
            await transaction.rollback();
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        if (!position) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Position not found."
            });
        }

        if (!parish) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: "Parish not found."
            });
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create(
            {
                name,
                email,
                password: hashed,
                phoneNumber,
                isActive: false,
                approvalStatus: "pending"
            },
            { transaction }
        );

        const member = await Member.create(
            {
                userId: user.id,
                parishId,
                positionId,
                gender,
                dateOfBirth
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: "Registration submitted. Await super admin approval.",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    isActive: user.isActive,
                    approvalStatus: user.approvalStatus
                },
                member: {
                    id: member.id,
                    parishId: member.parishId,
                    positionId: member.positionId,
                    isSuper: member.isSuper,
                    gender: member.gender,
                    dateOfBirth: member.dateOfBirth
                }
            }
        });
    } catch (error) {
        await transaction.rollback();
        return res
            .status(500)
            .json(await errorHandler(error, "Error during registration", req.originalUrl));
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.isActive || user.approvalStatus !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Account is not active. Await admin approval."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const member = await Member.findOne({
            where: { userId: user.id },
            include: [{ model: Position, as: "position", attributes: ["id", "name", "isExco"] }]
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Only member accounts can login."
            });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    isActive: user.isActive,
                    approvalStatus: user.approvalStatus
                },
                member: member
                    ? {
                        id: member.id,
                        parishId: member.parishId,
                        positionId: member.positionId,
                        isSuper: member.isSuper,
                        position: member.position
                    }
                    : null
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error during login", req.originalUrl));
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required."
            });
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token."
            });
        }

        const user = await User.findOne({
            where: { id: payload.id, isActive: true }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found or inactive."
            });
        }

        if (user.approvalStatus !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Account is not approved."
            });
        }

        const member = await Member.findOne({
            where: { userId: user.id },
            include: [{ model: Position, as: "position", attributes: ["id", "name", "isExco"] }]
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: "Only member accounts can refresh tokens."
            });
        }

        const accessToken = signAccessToken(user);

        return res.status(200).json({
            success: true,
            data: { accessToken }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error refreshing token", req.originalUrl));
    }
};
