"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("events", {
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

      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      createdBy: {
        type: Sequelize.UUID,
        allowNull: true
      },

      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true
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

    await queryInterface.addIndex("events", ["name"]);
    await queryInterface.addIndex("events", ["createdAt"]);
    await queryInterface.addIndex("events", ["createdBy"]);
    await queryInterface.addIndex("events", ["updatedBy"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("events");
  }
};
