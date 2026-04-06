"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("members", "positionId", {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: "positions",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL"
        });

        await queryInterface.addColumn("members", "isSuper", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });

        await queryInterface.addIndex("members", ["positionId"]);
        await queryInterface.addIndex("members", ["isSuper"]);

        await queryInterface.sequelize.query(
            `
            UPDATE members m
            SET
              "positionId" = a."positionId",
              "isSuper" = a."isSuper"
            FROM administrators a
            WHERE a."userId" = m."userId"
            `
        );
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("members", ["isSuper"]);
        await queryInterface.removeIndex("members", ["positionId"]);
        await queryInterface.removeColumn("members", "isSuper");
        await queryInterface.removeColumn("members", "positionId");
    }
};
