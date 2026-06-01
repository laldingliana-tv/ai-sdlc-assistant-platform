import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed development data
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ai-sdlc.dev' },
    update: {},
    create: {
      email: 'admin@ai-sdlc.dev',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@ai-sdlc.dev' },
    update: {},
    create: {
      email: 'dev@ai-sdlc.dev',
      name: 'Developer User',
      role: 'DEVELOPER',
    },
  });

  // Golden demo task
  const task = await prisma.task.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Implement dark mode support across all MFEs',
      description:
        'Add dark mode toggle and comprehensive theme support to all micro-frontends. This includes a ThemeProvider, CSS variable strategy, and persisted user preference.',
      status: 'PENDING',
      priority: 'HIGH',
      labels: ['ui', 'dark-mode', 'cross-cutting'],
      createdById: devUser.id,
    },
  });

  console.log('Seeded:', { adminUser, devUser, task });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
