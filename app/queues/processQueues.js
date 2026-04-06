const { eventQueue, birthdayQueue } = require("./index");
const { scheduleBirthdayReminder } = require("./scheduler");

// Process jobs in the eventQueue
eventQueue.process(async (job) => {
  try {
    const result = await require("../jobs/Event")(job);
    // console.log(result);
  } catch (error) {
    console.error("Error processing job:", error);
    throw error;
  }
});

// Process birthday reminder jobs
birthdayQueue.process(async (job) => {
  try {
    const result = await require("../jobs/BirthdayReminder")(job);
    console.log("[BirthdayReminder] Job done:", result);
  } catch (error) {
    console.error("[BirthdayReminder] Job failed:", error);
    throw error;
  }
});

// Register scheduled (repeatable) jobs
scheduleBirthdayReminder().catch((err) =>
  console.error("[Scheduler] Failed to schedule birthday reminder:", err)
);

console.log("Queues are running...");
