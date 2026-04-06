"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const Member = postgresDb.define(
    "members",
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

        parishId: {
            type: Sequelize.UUID,
            allowNull: true
        },

        positionId: {
            type: Sequelize.UUID,
            allowNull: true
        },

        isSuper: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        isExco: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

        gender: {
            type: Sequelize.STRING,
            allowNull: false
        },

        dateOfBirth: {
            type: Sequelize.DATEONLY,
            allowNull: false
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["userId"], unique: true },
            { fields: ["parishId"] },
            { fields: ["positionId"] },
            { fields: ["isSuper"] },
            { fields: ["isExco"] },
            { fields: ["gender"] },
            { fields: ["createdAt"] }
        ]
    }
);

module.exports = Member;