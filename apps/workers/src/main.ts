// Orchestration owner: Temporal
import { createLogger } from '@ai-sdlc/infra/telemetry';
import { Worker, NativeConnection } from '@temporalio/worker';

import * as activities from './activities/index.js';
import { startHealthServer, setConnected } from './health.js';

const logger = createLogger({ name: 'workers' });

const TASK_QUEUE = 'ai-sdlc-tasks';
const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const HEALTH_PORT = parseInt(process.env['HEALTH_PORT'] ?? '8081', 10);

async function main(): Promise<void> {
  // Start health probe server
  startHealthServer(HEALTH_PORT);

  logger.info({ address: TEMPORAL_ADDRESS }, 'Connecting to Temporal');

  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: TASK_QUEUE,
    workflowsPath: new URL('./workflows/sdlc-task.workflow.js', import.meta.url).pathname,
    activities,
  });

  setConnected(true);
  logger.info({ taskQueue: TASK_QUEUE }, 'Worker started, polling task queue');

  // Block until worker shuts down
  await worker.run();

  setConnected(false);
  logger.info('Worker shut down');
}

main().catch((err) => {
  logger.fatal({ err }, 'Worker failed to start');
  process.exit(1);
});
