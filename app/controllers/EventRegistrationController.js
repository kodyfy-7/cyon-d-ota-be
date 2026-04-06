"use strict";

const { fn, col } = require("sequelize");
const errorHandler = require("../../middleware/errorHandler");
const PaginationService = require("../../helpers/pagination");

const Event = require("../../models/Event");
const Parish = require("../../models/Parish");
const EventRegistration = require("../../models/EventRegistration");

exports.createEventRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { fullName, parishId, ageRange, gender } = req.body;

        const [event, parish] = await Promise.all([
            Event.findOne({ where: { id: eventId } }),
            Parish.findOne({ where: { id: parishId } })
        ]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        if (!parish) {
            return res.status(404).json({
                success: false,
                message: "Parish not found"
            });
        }

        const registration = await EventRegistration.create({
            eventId,
            parishId,
            fullName,
            ageRange,
            gender
        });

        return res.status(201).json({
            success: true,
            message: "Event registration submitted successfully.",
            data: registration
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error creating event registration", req.originalUrl));
    }
};

exports.getEventRegistrations = async (req, res) => {
    try {
        const { eventId } = req.params;
        const {
            page = 1,
            perPage = 25,
            sort = "createdAt:desc",
            parishId,
            gender
        } = req.query;

        const event = await Event.findOne({ where: { id: eventId } });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const where = { eventId };

        if (parishId) where.parishId = parishId;
        if (gender) where.gender = gender;

        const paginate = PaginationService.pagination({ page, perPage });

        const results = await EventRegistration.findAndCountAll({
            where,
            include: [{ model: Parish, as: "parish", attributes: ["id", "name", "isDeanery"] }],
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
            data: { registrations: results.rows },
            meta
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching event registrations", req.originalUrl));
    }
};

exports.getEventRegistrationSummaryByParish = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findOne({ where: { id: eventId } });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const summary = await EventRegistration.findAll({
            where: { eventId },
            include: [{ model: Parish, as: "parish", attributes: [] }],
            attributes: [
                "parishId",
                [col("parish.name"), "parishName"],
                [fn("COUNT", col("event_registrations.id")), "registrationCount"]
            ],
            group: ["parishId", "parish.id"],
            order: [[fn("COUNT", col("event_registrations.id")), "DESC"]],
            raw: true
        });

        const totalRegistrations = await EventRegistration.count({ where: { eventId } });

        return res.status(200).json({
            success: true,
            data: {
                event: {
                    id: event.id,
                    name: event.name
                },
                totalRegistrations,
                byParish: summary
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching registration summary", req.originalUrl));
    }
};
