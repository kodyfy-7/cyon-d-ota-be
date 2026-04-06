"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("positions", {
            id: {
                type: Sequelize.UUID,
                allowNull: false,
                primaryKey: true,
                defaultValue: Sequelize.literal("gen_random_uuid()")
            },

            name: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
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

        await queryInterface.addIndex("positions", ["name"], { unique: true });
        await queryInterface.addIndex("positions", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("positions");
    }
};