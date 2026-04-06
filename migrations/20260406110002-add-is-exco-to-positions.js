"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("positions", "isExco", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });

        await queryInterface.addIndex("positions", ["isExco"]);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("positions", ["isExco"]);
        await queryInterface.removeColumn("positions", "isExco");
    }
};
