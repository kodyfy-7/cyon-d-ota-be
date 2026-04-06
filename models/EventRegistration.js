"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const EventRegistration = postgresDb.define(
    "event_registrations",
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: new Sequelize.UUIDV4(),
            primaryKey: true,
            unique: true
        },

        eventId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        parishId: {
            type: Sequelize.UUID,
            allowNull: false
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
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["eventId"] },
            { fields: ["parishId"] },
            { fields: ["gender"] },
            { fields: ["createdAt"] }
        ]
    }
);

module.exports = EventRegistration;
