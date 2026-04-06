"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const Position = postgresDb.define(
    "positions",
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: new Sequelize.UUIDV4(),
            primaryKey: true,
            unique: true
        },

        name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },

        isExco: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["name"], unique: true },
            { fields: ["isExco"] },
            { fields: ["createdAt"] }
        ]
    }
);

module.exports = Position;