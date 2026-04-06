"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const Parish = postgresDb.define(
    "parishes",
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: new Sequelize.UUIDV4(),
            primaryKey: true,
            unique: true
        },

        name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        isDeanery: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["name"] },
            { fields: ["isDeanery"] },
            { fields: ["createdAt"] }
        ]
    }
);

module.exports = Parish;
