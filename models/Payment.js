"use strict";

const Sequelize = require("sequelize");
const postgresDb = require("../database/PostgresDb");

const Payment = postgresDb.define(
    "payments",
    {
        id: {
            type: Sequelize.UUID,
            defaultValue: new Sequelize.UUIDV4(),
            primaryKey: true,
            unique: true
        },

        reference: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },

        memberId: {
            type: Sequelize.UUID,
            allowNull: true
        },

        parishId: {
            type: Sequelize.UUID,
            allowNull: false
        },

        paymentType: {
            type: Sequelize.STRING,
            allowNull: false
        },

        channel: {
            type: Sequelize.STRING,
            allowNull: false
        },

        amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: false
        },

        currency: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "NGN"
        },

        status: {
            type: Sequelize.STRING,
            allowNull: false
        },

        proofFileUrl: {
            type: Sequelize.STRING,
            allowNull: true
        },

        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },

        paystackReference: {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true
        },

        metadata: {
            type: Sequelize.JSONB,
            allowNull: true
        },

        approvedBy: {
            type: Sequelize.UUID,
            allowNull: true
        },

        approvedAt: {
            type: Sequelize.DATE,
            allowNull: true
        },

        rejectionReason: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["reference"], unique: true },
            { fields: ["memberId"] },
            { fields: ["parishId"] },
            { fields: ["paymentType"] },
            { fields: ["channel"] },
            { fields: ["status"] },
            { fields: ["paystackReference"], unique: true },
            { fields: ["approvedBy"] },
            { fields: ["createdAt"] }
        ]
    }
);

module.exports = Payment;
