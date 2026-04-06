"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("members", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal("gen_random_uuid()")
            },

            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },

            gender: {
                type: Sequelize.STRING,
                allowNull: false
            },

            outstation: {
                type: Sequelize.STRING,
                allowNull: true
            },

            dateOfBirth: {
                type: Sequelize.DATEONLY,
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

        await queryInterface.addIndex("members", ["userId"], { unique: true });
        await queryInterface.addIndex("members", ["gender"]);
        await queryInterface.addIndex("members", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("members");
    }
};