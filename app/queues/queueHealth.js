const calculateDynamicDelay = async queue => {
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "failed",
    "delayed"
  );

  const load =
    counts.waiting +
    counts.active +
    counts.delayed;

  // Base delay in ms
  let delay = 0;

  if (load < 500) {
    delay = 0;
  } else if (load < 2_000) {
    delay = 5_000;
  } else if (load < 10_000) {
    delay = 15_000;
  } else {
    delay = 30_000;
  }

  return delay;
};

module.exports = {
  calculateDynamicDelay
};
