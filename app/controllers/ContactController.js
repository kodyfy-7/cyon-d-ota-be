"use strict";

const moment = require("moment-timezone");

const errorHandler = require("../../middleware/errorHandler");
const Member = require("../../models/Member");
const User = require("../../models/User");
const mailGenerator = require("../../config/mail");
const { sendMail } = require("../services/MailService");
const contactUsMail = require("../../resources/mails/contactUsMail");

const getAdminEmails = async () => {
    const members = await Member.findAll({
        where: { isSuper: true },
        include: [{ model: User, as: "user", attributes: ["email"] }]
    });

    return members
        .map((member) => member.user && member.user.email)
        .filter(Boolean);
};

exports.submitContactUs = async (req, res) => {
    try {
        const { name, email, phoneNumber, subject, message } = req.body;

        const adminEmails = await getAdminEmails();
        if (adminEmails.length === 0) {
            return res.status(503).json({
                success: false,
                message: "No admin recipient configured"
            });
        }

        const timezone = process.env.APP_TIMEZONE || "Africa/Lagos";
        const submittedAt = moment().tz(timezone).format("DD MMMM YYYY, h:mm A z");

        const template = contactUsMail({
            name,
            email,
            phoneNumber,
            subject,
            message,
            submittedAt
        });

        const emailBody = mailGenerator.generate(template);
        const mailSubject = `[Contact Us] ${subject}`;

        const results = await Promise.allSettled(
            adminEmails.map((recipient) => sendMail(recipient, mailSubject, emailBody))
        );

        const failed = results.filter((r) => r.status === "rejected").length;
        const sent = adminEmails.length - failed;

        return res.status(200).json({
            success: true,
            message: "Message received successfully",
            data: {
                forwardedTo: sent,
                failedToForward: failed
            }
        });
    } catch (error) {
        return res
            .status(500)
            .json(await errorHandler(error, "Error submitting contact message", req.originalUrl));
    }
};
