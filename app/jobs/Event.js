"use strict";

const sequelize = require("../../database/PostgresDb");
const Event = require("../../models/Event");

module.exports = async (job) => {
  const {
    product,
    environment,
    eventName,
    eventCategory,
    eventVersion,
    userId,
    anonymousId,
    orgId,
    payload,
    sourceService,
    ipAddress,
    userAgent
  } = job.data;

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // Insert into Postgres
    await Event.create(
      {
        product,
        environment,
        eventName,
        eventCategory,
        eventVersion,
        userId,
        anonymousId,
        orgId,
        payload,
        sourceService,
        ipAddress,
        userAgent
      },
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error processing event job:", error);
    throw new Error(`Failed to process event job: ${error.message}`);
  }
};
