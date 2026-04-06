"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("parishes", {
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

            isDeanery: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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

        await queryInterface.addIndex("parishes", ["name"]);
        await queryInterface.addIndex("parishes", ["isDeanery"]);
        await queryInterface.addIndex("parishes", ["createdAt"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("parishes");
    }
};
