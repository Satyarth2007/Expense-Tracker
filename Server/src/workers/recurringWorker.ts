import { Worker } from "bullmq";
import { bullmqConnection } from "../config/bullmqRedis.js";
import { RECURRING_QUEUE_NAME } from "../queues/recurringQueue.js";
import { processRecurringSweep } from "../jobs/processRecurringSweep.js";

export const recurringWorker = new Worker(
  RECURRING_QUEUE_NAME,
  async (job) => {
    console.log(`Running recurring sweep job (id: ${job.id})`);
    return await processRecurringSweep();
  },
  { connection: bullmqConnection }
);

recurringWorker.on("completed", (job, result) => {
  console.log(`Recurring sweep job ${job.id} completed:`, result);
});

recurringWorker.on("failed", (job, err) => {
  console.error(`Recurring sweep job ${job?.id} failed:`, err);
});