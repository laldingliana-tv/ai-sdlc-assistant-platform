/**
 * OpenTelemetry bootstrap for distributed tracing.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

import { logger } from './logger.js';

export type { Span } from '@opentelemetry/api';
export { trace, context, SpanStatusCode };

export interface TracingConfig {
  serviceName: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  enabled?: boolean;
}

let sdk: NodeSDK | undefined;

export function initTracing(config: TracingConfig): void {
  const {
    serviceName,
    serviceVersion = '0.0.1',
    otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'],
    enabled = true,
  } = config;

  if (!enabled) {
    logger.info('Tracing disabled');
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: serviceVersion,
  });

  sdk = new NodeSDK({
    resource,
    ...(otlpEndpoint
      ? { traceExporter: new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }) }
      : {}),
  });

  sdk.start();
  logger.info({ serviceName, otlpEndpoint }, 'Tracing initialized');
}

export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    logger.info('Tracing shut down');
  }
}

export function getTracer(name: string) {
  return trace.getTracer(name);
}
