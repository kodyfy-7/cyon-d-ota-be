"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("event_registrations", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal("gen_random_uuid()")
            },

            eventId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "events",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },

            parishId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "parishes",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"
            },

            fullName: {
                type: Sequelize.STRING,
                allowNull: false
            },

            ageRange: {
                type: Sequelize.STRING,
                allowNull: false
            },

            gender: {
                type: Sequelize.STRING,
                allowNull: false
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW")
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW")
            },

            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        await queryInterface.addIndex("event_registrations", ["eventId"]);
        await queryInterface.addIndex("event_registrations", ["parishId"]);
        await queryInterface.addIndex("event_registrations", ["gender"]);
        await queryInterface.addIndex("event_registrations", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("event_registrations");
    }
};
