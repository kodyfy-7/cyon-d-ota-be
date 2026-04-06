"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("users", "approvalStatus", {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "approved"
        });

        await queryInterface.addIndex("users", ["approvalStatus"]);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("users", ["approvalStatus"]);
        await queryInterface.removeColumn("users", "approvalStatus");
    }
};
