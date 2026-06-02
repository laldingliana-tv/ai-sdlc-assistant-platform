import { describe, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.js';

describe('App (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeGreaterThan(0);
  });

  it('/tasks (POST)', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/tasks',
      payload: {
        title: 'Implement dark mode support across all MFEs',
        description: 'Add dark mode toggle and theme support to all micro-frontends',
      },
    });
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.payload);
    expect(body.id).toBeDefined();
    expect(body.title).toBe('Implement dark mode support across all MFEs');
    expect(body.status).toBe('pending');
  });
});
