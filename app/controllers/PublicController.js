"use strict";

const errorHandler = require("../../middleware/errorHandler");
const Event = require("../../models/Event");
const Member = require("../../models/Member");
const Parish = require("../../models/Parish");
const EventRegistration = require("../../models/EventRegistration");

exports.getPublicSummary = async (req, res) => {
    try {
        const [numberOfEvents, numberOfMembers, numberOfParishes, numberOfEventRegistrations] = await Promise.all([
            Event.count(),
            Member.count(),
            Parish.count(),
            EventRegistration.count(),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                numberOfEvents,
                numberOfMembers,
                numberOfParishes,
                numberOfEventRegistrations,
            },
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error fetching public summary", req.originalUrl));
    }
};
