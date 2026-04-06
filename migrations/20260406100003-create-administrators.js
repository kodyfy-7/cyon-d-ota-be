"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("administrators", {
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

            positionId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: "positions",
                    key: "id"
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"
            },

            isSuper: {
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

        await queryInterface.addIndex("administrators", ["userId"], { unique: true });
        await queryInterface.addIndex("administrators", ["positionId"]);
        await queryInterface.addIndex("administrators", ["isSuper"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("administrators");
    }
};