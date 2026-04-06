"use strict";

const errorHandler = require("../../middleware/errorHandler");
const { Op } = require("sequelize");
const postgresDb = require("../../database/PostgresDb");
const PaginationService = require("../../helpers/pagination");

const User = require("../../models/User");
const Member = require("../../models/Member");
const Position = require("../../models/Position");
const Parish = require("../../models/Parish");

exports.getAllMembers = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 25,
            sort = "createdAt:desc",
            search,
            gender,
            parishId,
            positionId,
            approvalStatus,
            isSuper
        } = req.query;

        const where = {};

        if (gender) where.gender = gender;
        if (parishId) where.parishId = parishId;
        if (positionId) where.positionId = positionId;
        if (typeof isSuper !== "undefined") where.isSuper = String(isSuper) === "true";

        if (search) {
            where[Op.or] = [
                { "$user.name$": { [Op.iLike]: `%${search}%` } },
                { "$user.email$": { [Op.iLike]: `%${search}%` } }
            ];
        }

        const paginate = PaginationService.pagination({ page, perPage });

        const include = [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"],
                ...(approvalStatus ? { where: { approvalStatus } } : {})
            },
            { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
            { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
        ];

        const results = await Member.findAndCountAll({
            where,
            include,
            order: PaginationService.sortList({ sort }),
            ...paginate,
            subQuery: false
        });

        const meta = PaginationService.paginationLink({
            total: results.count,
            page,
            perPage
        });

        return res.status(200).json({
            success: true,
            data: { members: results.rows },
            meta
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching members", req.originalUrl));
    }
};

exports.getMemberById = async (req, res) => {
    try {
        const { memberId } = req.params;

        const member = await Member.findOne({
            where: { id: memberId },
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"] },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching member", req.originalUrl));
    }
};

exports.createMember = async (req, res) => {
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
            dateOfBirth,
            isSuper = false
        } = req.body;

        const [parish, position] = await Promise.all([
            Parish.findOne({ where: { id: parishId }, transaction }),
            Position.findOne({ where: { id: positionId }, transaction })
        ]);

        if (!parish) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Parish not found" });
        }

        if (!position) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        const existing = await User.findOne({ where: { email }, transaction });
        if (existing) {
            await transaction.rollback();
            return res.status(409).json({ success: false, message: "A user with this email already exists." });
        }

        const bcrypt = require("bcryptjs");
        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password: hashed, phoneNumber }, { transaction });

        const member = await Member.create(
            {
                userId: user.id,
                parishId,
                positionId,
                isSuper: Boolean(isSuper),
                isExco: Boolean(position.isExco),
                gender,
                dateOfBirth
            },
            { transaction }
        );

        await transaction.commit();

        const memberWithRelations = await Member.findOne({
            where: { id: member.id },
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"] },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        return res.status(201).json({
            success: true,
            message: "Member created successfully.",
            data: memberWithRelations
        });
    } catch (error) {
        await transaction.rollback();
        return res
            .status(500)
            .json(await errorHandler(error, "Error creating member", req.originalUrl));
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { name, phoneNumber, parishId, positionId, gender, dateOfBirth, isActive, isSuper } = req.body;

        const member = await Member.findOne({
            where: { id: memberId },
            include: [{ model: User, as: "user" }]
        });

        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        if (name !== undefined) member.user.name = name;
        if (phoneNumber !== undefined) member.user.phoneNumber = phoneNumber;
        if (isActive !== undefined) member.user.isActive = isActive;

        if (parishId !== undefined) {
            const parish = await Parish.findOne({ where: { id: parishId } });
            if (!parish) {
                return res.status(404).json({ success: false, message: "Parish not found" });
            }
            member.parishId = parishId;
        }

        if (positionId !== undefined) {
            const position = await Position.findOne({ where: { id: positionId } });
            if (!position) {
                return res.status(404).json({ success: false, message: "Position not found" });
            }
            member.positionId = positionId;
            member.isExco = Boolean(position.isExco);
        }

        if (typeof isSuper !== "undefined") member.isSuper = Boolean(isSuper);
        if (gender !== undefined) member.gender = gender;
        if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth;

        await member.user.save();
        await member.save();

        const updated = await Member.findOne({
            where: { id: memberId },
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"] },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        return res.status(200).json({ success: true, message: "Member updated successfully.", data: updated });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error updating member", req.originalUrl));
    }
};

exports.deleteMember = async (req, res) => {
    const transaction = await postgresDb.transaction();
    try {
        const { memberId } = req.params;

        const member = await Member.findOne({
            where: { id: memberId },
            include: [{ model: User, as: "user" }],
            transaction
        });

        if (!member) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        await member.destroy({ transaction });
        await member.user.destroy({ transaction });

        await transaction.commit();

        return res.status(200).json({ success: true, message: "Member deleted successfully." });
    } catch (error) {
        await transaction.rollback();
        return res
            .status(500)
            .json(await errorHandler(error, "Error deleting member", req.originalUrl));
    }
};

exports.makeAdministrator = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { positionId, isSuper = false } = req.body;

        const member = await Member.findOne({ where: { id: memberId } });
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        const position = await Position.findOne({ where: { id: positionId } });
        if (!position) {
            return res.status(404).json({ success: false, message: "Position not found" });
        }

        member.positionId = positionId;
        member.isSuper = Boolean(isSuper);
        member.isExco = Boolean(position.isExco);
        await member.save();

        const updated = await Member.findOne({
            where: { id: memberId },
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"] },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Member role updated successfully.",
            data: updated
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error updating member role", req.originalUrl));
    }
};

exports.unmakeAdministrator = async (req, res) => {
    try {
        const { memberId } = req.params;

        const member = await Member.findOne({ where: { id: memberId } });
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        member.isSuper = false;
        await member.save();

        const updated = await Member.findOne({
            where: { id: memberId },
            include: [
                { model: User, as: "user", attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"] },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        return res.status(200).json({
            success: true,
            message: "Member super admin privilege removed.",
            data: updated
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error removing super admin privilege", req.originalUrl));
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const [user, member] = await Promise.all([
            User.findOne({
                where: { id: userId },
                attributes: ["id", "name", "email", "phoneNumber", "isActive", "approvalStatus"]
            }),
            Member.findOne({
                where: { userId },
                include: [
                    { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                    { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
                ]
            })
        ]);

        if (!user || !member) {
            return res.status(404).json({ success: false, message: "Profile not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                member: {
                    id: member.id,
                    userId: member.userId,
                    parishId: member.parishId,
                    positionId: member.positionId,
                    isSuper: member.isSuper,
                    isExco: member.isExco,
                    gender: member.gender,
                    dateOfBirth: member.dateOfBirth,
                    createdAt: member.createdAt,
                    updatedAt: member.updatedAt,
                    deletedAt: member.deletedAt,
                    parish: member.parish,
                    position: member.position,
                    user
                }
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching profile", req.originalUrl));
    }
};

exports.updateMemberApprovalStatus = async (req, res) => {
    try {
        if (!req.member?.isSuper) {
            return res.status(403).json({
                success: false,
                message: "Only super admin can approve or reject registrations."
            });
        }

        const { memberId } = req.params;
        const { action } = req.body;

        const member = await Member.findOne({
            where: { id: memberId },
            include: [
                { model: User, as: "user" },
                { model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] },
                { model: Position, as: "position", attributes: ["id", "name", "isExco"] }
            ]
        });

        if (!member || !member.user) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        if (action === "approve") {
            member.user.isActive = true;
            member.user.approvalStatus = "approved";
        } else {
            member.user.isActive = false;
            member.user.approvalStatus = "rejected";
        }

        await member.user.save();

        return res.status(200).json({
            success: true,
            message: action === "approve" ? "Member approved successfully." : "Member rejected successfully.",
            data: {
                member: {
                    id: member.id,
                    parish: member.parish,
                    position: member.position,
                    isSuper: member.isSuper,
                    user: {
                        id: member.user.id,
                        name: member.user.name,
                        email: member.user.email,
                        isActive: member.user.isActive,
                        approvalStatus: member.user.approvalStatus
                    }
                }
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error updating member approval status", req.originalUrl));
    }
};
