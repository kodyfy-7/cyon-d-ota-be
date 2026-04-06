"use strict";

const { Op } = require("sequelize");
const moment = require("moment-timezone");

const Member = require("../../models/Member");
const User = require("../../models/User");
const db = require("../../database/PostgresDb");
const BirthdayNotifier = require("../services/BirthdayNotifier");

module.exports = async (job) => {
    const tz = process.env.APP_TIMEZONE || "Africa/Lagos";
    const today = moment().tz(tz);
    const month = today.month() + 1; // moment months are 0-indexed
    const day = today.date();

    console.log(`[BirthdayReminder] Checking birthdays for ${today.format("DD MMMM YYYY")} (${tz})`);

    const members = await Member.findAll({
        where: {
            [Op.and]: [
                db.where(db.fn("DATE_PART", "month", db.col("members.dateOfBirth")), month),
                db.where(db.fn("DATE_PART", "day", db.col("members.dateOfBirth")), day),
            ],
        },
        include: [
            {
                model: User,
                as: "user",
                attributes: ["name", "phoneNumber"],
            },
        ],
    });

    if (members.length === 0) {
        console.log(`[BirthdayReminder] No birthdays today.`);
        return { sent: false, count: 0 };
    }

    console.log(`[BirthdayReminder] Found ${members.length} birthday(s) today.`);
    await BirthdayNotifier.send(members, today);

    return { sent: true, count: members.length };
};
