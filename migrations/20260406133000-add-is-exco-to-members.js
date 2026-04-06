"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("members", "isExco", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });

        await queryInterface.sequelize.query(`
            UPDATE members AS m
            SET "isExco" = COALESCE(p."isExco", false)
            FROM positions AS p
            WHERE m."positionId" = p.id;
        `);

        await queryInterface.addIndex("members", ["isExco"]);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("members", ["isExco"]);
        await queryInterface.removeColumn("members", "isExco");
    }
};
