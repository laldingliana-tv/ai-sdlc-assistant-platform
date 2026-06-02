import 'reflect-metadata';
import { AppLoggerService } from '@ai-sdlc/infra/logging';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new AppLoggerService('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { logger },
  );

  app.enableCors({
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`API server running on http://localhost:${port}`);
}

bootstrap();
