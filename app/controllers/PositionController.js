"use strict";

const { Op } = require("sequelize");
const errorHandler = require("../../middleware/errorHandler");
const PaginationService = require("../../helpers/pagination");

const Position = require("../../models/Position");
const Member = require("../../models/Member");

exports.getAllPositions = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 25,
            sort = "createdAt:desc",
            search,
            isExco
        } = req.query;

        const where = {};

        if (typeof isExco !== "undefined") {
            where.isExco = String(isExco) === "true";
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const paginate = PaginationService.pagination({ page, perPage });

        const results = await Position.findAndCountAll({
            where,
            order: PaginationService.sortList({ sort }),
            ...paginate
        });

        const meta = PaginationService.paginationLink({
            total: results.count,
            page,
            perPage
        });

        return res.status(200).json({
            success: true,
            data: { positions: results.rows },
            meta
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching positions", req.originalUrl));
    }
};

exports.getPositionById = async (req, res) => {
    try {
        const { positionId } = req.params;

        const position = await Position.findOne({ where: { id: positionId } });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: position
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching position", req.originalUrl));
    }
};

exports.createPosition = async (req, res) => {
    try {
        const { name, isExco = false } = req.body;

        const existing = await Position.findOne({ where: { name } });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Position already exists"
            });
        }

        const position = await Position.create({ name, isExco: Boolean(isExco) });

        return res.status(201).json({
            success: true,
            message: "Position created successfully.",
            data: position
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error creating position", req.originalUrl));
    }
};

exports.updatePosition = async (req, res) => {
    try {
        const { positionId } = req.params;
        const { name, isExco } = req.body;

        const position = await Position.findOne({ where: { id: positionId } });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found"
            });
        }

        if (name !== undefined) {
            const duplicate = await Position.findOne({
                where: {
                    name,
                    id: { [Op.ne]: positionId }
                }
            });

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Another position with this name already exists"
                });
            }

            position.name = name;
        }

        if (typeof isExco !== "undefined") {
            position.isExco = Boolean(isExco);
        }

        await position.save();

        return res.status(200).json({
            success: true,
            message: "Position updated successfully.",
            data: position
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error updating position", req.originalUrl));
    }
};

exports.deletePosition = async (req, res) => {
    try {
        const { positionId } = req.params;

        const position = await Position.findOne({ where: { id: positionId } });

        if (!position) {
            return res.status(404).json({
                success: false,
                message: "Position not found"
            });
        }

        const memberCount = await Member.count({
            where: { positionId }
        });

        if (memberCount > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this position because it is assigned to one or more members."
            });
        }

        await position.destroy();

        return res.status(200).json({
            success: true,
            message: "Position deleted successfully."
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error deleting position", req.originalUrl));
    }
};