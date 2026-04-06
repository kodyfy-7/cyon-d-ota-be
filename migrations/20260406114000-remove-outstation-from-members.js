"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.removeColumn("members", "outstation");
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn("members", "outstation", {
            type: Sequelize.STRING,
            allowNull: true
        });
    }
};
