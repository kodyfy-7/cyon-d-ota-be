"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("members", "parishId", {
            type: Sequelize.UUID,
            allowNull: true,
            references: {
                model: "parishes",
                key: "id"
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT"
        });

        await queryInterface.addIndex("members", ["parishId"]);
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("members", ["parishId"]);
        await queryInterface.removeColumn("members", "parishId");
    }
};
