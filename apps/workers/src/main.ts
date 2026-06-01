// Orchestration owner: Temporal
import { Worker, NativeConnection } from '@temporalio/worker';
import { startHealthServer, setConnected } from './health.js';
import * as activities from './activities/index.js';

const TASK_QUEUE = 'ai-sdlc-tasks';
const TEMPORAL_ADDRESS = process.env['TEMPORAL_ADDRESS'] ?? 'localhost:7233';
const HEALTH_PORT = parseInt(process.env['HEALTH_PORT'] ?? '8081', 10);

async function main(): Promise<void> {
  // Start health probe server
  startHealthServer(HEALTH_PORT);

  console.log(`Connecting to Temporal at ${TEMPORAL_ADDRESS}...`);

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
  console.log(`Worker started, polling task queue: ${TASK_QUEUE}`);

  // Block until worker shuts down
  await worker.run();

  setConnected(false);
  console.log('Worker shut down');
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
