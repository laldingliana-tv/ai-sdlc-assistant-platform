// Orchestration owner: Temporal
import http from 'node:http';

import { createLogger } from '@ai-sdlc/infra/telemetry';

const logger = createLogger({ name: 'workers-health' });

let isConnected = false;

/**
 * Minimal HTTP health/readiness probe server for K8s/Cloud Run liveness checks.
 * Returns 200 when the worker is connected to Temporal, 503 otherwise.
 */
export function startHealthServer(port: number = 8081): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/ready' || req.url === '/') {
      if (isConnected) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', connected: true }));
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unavailable', connected: false }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info({ port }, 'Health probe server listening');
  });

  return server;
}

export function setConnected(connected: boolean): void {
  isConnected = connected;
}
