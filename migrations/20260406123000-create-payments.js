"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("payments", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal("gen_random_uuid()")
            },

            reference: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },

            memberId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: "members",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
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
                allowNull: true,
                references: {
                    model: "members",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL"
            },

            approvedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },

            rejectionReason: {
                type: Sequelize.TEXT,
                allowNull: true
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

        await queryInterface.addIndex("payments", ["reference"], { unique: true });
        await queryInterface.addIndex("payments", ["memberId"]);
        await queryInterface.addIndex("payments", ["parishId"]);
        await queryInterface.addIndex("payments", ["paymentType"]);
        await queryInterface.addIndex("payments", ["channel"]);
        await queryInterface.addIndex("payments", ["status"]);
        await queryInterface.addIndex("payments", ["paystackReference"], { unique: true });
        await queryInterface.addIndex("payments", ["approvedBy"]);
        await queryInterface.addIndex("payments", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("payments");
    }
};
