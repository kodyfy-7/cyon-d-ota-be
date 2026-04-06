/**
 * Mailgen template for the daily birthday digest sent to admins.
 *
 * @param {string} dateStr       - Formatted date, e.g. "06 April 2026"
 * @param {Array}  birthdayRows  - Array of { name, phoneNumber } objects
 */
module.exports = (dateStr, birthdayRows) => {
    const table = {
        data: birthdayRows.map((m, i) => ({
            "#": i + 1,
            Name: m.name,
            "Phone Number": m.phoneNumber || "—",
        })),
        columns: {
            customWidth: { "#": "5%", Name: "50%", "Phone Number": "45%" },
            customAlignment: { "#": "center" },
        },
    };

    return {
        body: {
            greeting: false,
            signature: false,
            intro: [
                `🎂 <strong>Birthday Digest — ${dateStr}</strong>`,
                `The following member(s) are celebrating their birthday today:`,
            ],
            table,
            outro: [
                `Please reach out and wish them a wonderful day! 🎉`,
                `<em>This is an automated message from ${process.env.APP_NAME || "SACC"}</em>`,
            ],
        },
    };
};
