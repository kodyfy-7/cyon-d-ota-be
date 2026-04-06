"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal("gen_random_uuid()")
            },

            name: {
                type: Sequelize.STRING,
                allowNull: false
            },

            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },

            password: {
                type: Sequelize.STRING,
                allowNull: false
            },

            phoneNumber: {
                type: Sequelize.STRING,
                allowNull: true
            },

            isActive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
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

        await queryInterface.addIndex("users", ["email"], { unique: true });
        await queryInterface.addIndex("users", ["isActive"]);
        await queryInterface.addIndex("users", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("users");
    }
};