import { Queue } from "bullmq";
import { bullmqConnection } from "../config/bullmqRedis.js";

export const RECURRING_QUEUE_NAME = "recurring-sweep";

export const recurringQueue = new Queue(RECURRING_QUEUE_NAME, {
  connection: bullmqConnection,
});

/**
 * Registers the daily repeatable job using BullMQ's Job Scheduler API
 * (replaces the old queue.add(..., { repeat }) pattern removed in newer
 * BullMQ versions). upsertJobScheduler is idempotent by schedulerId —
 * calling this on every server restart updates the existing schedule
 * rather than creating duplicates.
 */
export async function scheduleRecurringSweep() {
  await recurringQueue.upsertJobScheduler(
    "recurring-daily-sweep", // schedulerId — unique identifier for this schedule
    {
      pattern: "0 0 * * *", // cron: every day at 00:00 server time
    },
    {
      name: "daily-sweep",
      data: {},
      opts: {
        removeOnComplete: true,
        removeOnFail: 50,
      },
    }
  );
  console.log("Recurring sweep scheduled: daily at 00:00");
}