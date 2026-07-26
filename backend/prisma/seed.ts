import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/bookmark_db?schema=public';

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with multi-user sample data...');

  // User A (Primary candidate user)
  const userA = 'auth0|66a5e12345_candidate';
  // User B (Secondary distinct user for privacy isolation testing)
  const userB = 'auth0|66b7f98765_secondary';

  // Clear existing seed data to ensure clean environment
  await prisma.collectionShare.deleteMany({});
  await prisma.bookmark.deleteMany({});
  await prisma.collection.deleteMany({});

  // Seed Collection & Bookmarks for User A
  const colA1 = await prisma.collection.create({
    data: {
      name: 'Developer Tools & Frameworks',
      ownerId: userA,
      bookmarks: {
        create: [
          {
            title: 'NestJS Framework Documentation',
            url: 'https://docs.nestjs.com',
            notes: 'Core backend framework documentation',
            ownerId: userA,
          },
          {
            title: 'Prisma ORM Reference',
            url: 'https://www.prisma.io/docs',
            notes: 'Database ORM queries and schema reference',
            ownerId: userA,
          },
        ],
      },
    },
  });

  await prisma.collection.create({
    data: {
      name: 'Personal Reading List',
      ownerId: userA,
      bookmarks: {
        create: [
          {
            title: 'Refactoring UI',
            url: 'https://www.refactoringui.com',
            notes: 'Design tips and UI patterns',
            ownerId: userA,
          },
        ],
      },
    },
  });

  // Seed Uncategorized Bookmark for User A
  await prisma.bookmark.create({
    data: {
      title: 'Uncategorized Quick Save',
      url: 'https://news.ycombinator.com',
      notes: 'Read later tech news',
      ownerId: userA,
    },
  });

  // Seed Collection & Bookmarks for User B (Separate distinct owner)
  await prisma.collection.create({
    data: {
      name: "User B's Confidential Research",
      ownerId: userB,
      bookmarks: {
        create: [
          {
            title: 'PostgreSQL Internals',
            url: 'https://www.postgresql.org/docs/current/internals.html',
            notes: 'Database indexing and concurrency notes',
            ownerId: userB,
          },
        ],
      },
    },
  });

  // Seed Share Token for User A's Developer Tools collection
  await prisma.collectionShare.create({
    data: {
      collectionId: colA1.id,
      shareToken: 'seed-share-token-usera-dev-tools',
    },
  });

  console.log('Seeding completed successfully:');
  console.log(`- Created collections and bookmarks for User A (${userA})`);
  console.log(`- Created collections and bookmarks for User B (${userB})`);
  console.log(`- Created sample share token: seed-share-token-usera-dev-tools`);
}

main()
  .catch((e) => {
    console.error('Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
