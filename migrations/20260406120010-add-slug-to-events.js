"use strict";

const slugify = require("slugify");

const toBaseSlug = (value) => {
    const slug = slugify(value || "event", { lower: true, strict: true, trim: true });
    return slug || "event";
};

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("events", "slug", {
            type: Sequelize.STRING,
            allowNull: true
        });

        const [events] = await queryInterface.sequelize.query(
            `SELECT id, name FROM events ORDER BY "createdAt" ASC`
        );

        const used = new Set();

        for (const event of events) {
            const base = toBaseSlug(event.name);
            let nextSlug = base;
            let suffix = 2;

            while (used.has(nextSlug)) {
                nextSlug = `${base}-${suffix}`;
                suffix += 1;
            }

            used.add(nextSlug);

            await queryInterface.bulkUpdate(
                "events",
                { slug: nextSlug },
                { id: event.id }
            );
        }

        await queryInterface.sequelize.query(
            `UPDATE events SET slug = CONCAT('event-', id::text) WHERE slug IS NULL`
        );

        await queryInterface.changeColumn("events", "slug", {
            type: Sequelize.STRING,
            allowNull: false
        });

        await queryInterface.addIndex("events", ["slug"], { unique: true });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("events", ["slug"]);
        await queryInterface.removeColumn("events", "slug");
    }
};
