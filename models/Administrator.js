"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const Administrator = postgresDb.define(
    "administrators",
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: new Sequelize.UUIDV4(),
            primaryKey: true,
            unique: true
        },

        userId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        positionId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        isSuper: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["userId"], unique: true },
            { fields: ["positionId"] },
            { fields: ["isSuper"] }
        ]
    }
);

module.exports = Administrator;