"use strict";

const { birthdayQueue } = require("./index");

// Daily at 7:00 AM in the configured timezone
const BIRTHDAY_CRON = "0 7 * * *";
const TIMEZONE = process.env.APP_TIMEZONE || "Africa/Lagos";

/**
 * Registers the birthday reminder as a Bull repeatable job.
 * Clears stale repeatable entries first so restarting the process never
 * duplicates the schedule.
 */
const scheduleBirthdayReminder = async () => {
    const existing = await birthdayQueue.getRepeatableJobs();
    for (const job of existing) {
        await birthdayQueue.removeRepeatableByKey(job.key);
    }

    await birthdayQueue.add(
        {},
        {
            repeat: { cron: BIRTHDAY_CRON, tz: TIMEZONE },
            jobId: "birthday-daily",
        }
    );

    console.log(`✅ Birthday reminder scheduled — daily at 07:00 AM (${TIMEZONE})`);
};

module.exports = { scheduleBirthdayReminder };
