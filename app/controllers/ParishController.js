"use strict";

const { Op } = require("sequelize");
const errorHandler = require("../../middleware/errorHandler");
const PaginationService = require("../../helpers/pagination");

const Parish = require("../../models/Parish");

exports.getAllParishes = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 25,
            sort = "createdAt:desc",
            search,
            isDeanery
        } = req.query;

        const where = {};

        if (typeof isDeanery !== "undefined") {
            where.isDeanery = String(isDeanery) === "true";
        }

        if (search) {
            where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }];
        }

        const paginate = PaginationService.pagination({ page, perPage });

        const results = await Parish.findAndCountAll({
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
            data: { parishes: results.rows },
            meta
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching parishes", req.originalUrl));
    }
};

exports.getParishById = async (req, res) => {
    try {
        const { parishId } = req.params;

        const parish = await Parish.findOne({ where: { id: parishId } });

        if (!parish) {
            return res.status(404).json({
                success: false,
                message: "Parish not found"
            });
        }

        return res.status(200).json({ success: true, data: parish });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching parish", req.originalUrl));
    }
};

exports.createParish = async (req, res) => {
    try {
        const { name, isDeanery = false } = req.body;

        if (isDeanery) {
            const existingDeanery = await Parish.findOne({ where: { isDeanery: true } });
            if (existingDeanery) {
                return res.status(409).json({
                    success: false,
                    message: "A deanery parish already exists. Unset it before creating another."
                });
            }
        }

        const parish = await Parish.create({
            name,
            isDeanery: Boolean(isDeanery)
        });

        return res.status(201).json({
            success: true,
            message: "Parish created successfully.",
            data: parish
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error creating parish", req.originalUrl));
    }
};

exports.updateParish = async (req, res) => {
    try {
        const { parishId } = req.params;
        const { name, isDeanery } = req.body;

        const parish = await Parish.findOne({ where: { id: parishId } });

        if (!parish) {
            return res.status(404).json({
                success: false,
                message: "Parish not found"
            });
        }

        if (typeof isDeanery !== "undefined" && Boolean(isDeanery)) {
            const existingDeanery = await Parish.findOne({
                where: {
                    isDeanery: true,
                    id: { [Op.ne]: parishId }
                }
            });

            if (existingDeanery) {
                return res.status(409).json({
                    success: false,
                    message: "Another parish is already marked as deanery."
                });
            }
        }

        if (name !== undefined) parish.name = name;
        if (typeof isDeanery !== "undefined") parish.isDeanery = Boolean(isDeanery);

        await parish.save();

        return res.status(200).json({
            success: true,
            message: "Parish updated successfully.",
            data: parish
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error updating parish", req.originalUrl));
    }
};

exports.deleteParish = async (req, res) => {
    try {
        const { parishId } = req.params;

        const parish = await Parish.findOne({ where: { id: parishId } });

        if (!parish) {
            return res.status(404).json({
                success: false,
                message: "Parish not found"
            });
        }

        if (parish.isDeanery) {
            return res.status(409).json({
                success: false,
                message: "Deanery parish cannot be deleted until another parish is marked as deanery."
            });
        }

        await parish.destroy();

        return res.status(200).json({
            success: true,
            message: "Parish deleted successfully."
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error deleting parish", req.originalUrl));
    }
};
