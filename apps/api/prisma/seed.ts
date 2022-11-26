import { PodcastIdentity, PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
const prisma = new PrismaClient();

const podcastData = [
  {
    title: 'podcast1',
    published: true,
    showNote: 'showNote1',
  },
  {
    title: 'podcast2',
    published: true,
    showNote: 'showNote2',
  },
  {
    title: 'podcast3',
    published: true,
    showNote: 'showNote3',
  },
];

const userData = [
  {
    name: 'franky',
    email: 'q404023244@gmail.com',
  },
  {
    name: 'cabbage',
    email: 'test1@gmail.com',
  },
  {
    name: 'xinbao',
    email: 'test2@gmail.com',
  },
];

const tagData = [
  {
    name: 'JS',
  },
  { name: 'HTML' },
  { name: 'CSS' },
];

async function main() {
  await Promise.all([
    prisma.podcastTag.deleteMany(),
    prisma.podcastAuthor.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany(),
    prisma.podcast.deleteMany(),
  ]);
  const hash = await argon2.hash('passwd');

  const users = await prisma.user
    .createMany({
      data: userData.map((user) => ({ ...user, hash })),
      skipDuplicates: true,
    })
    .then(() => prisma.user.findMany());

  const tags = await prisma.tag
    .createMany({
      data: tagData,
    })
    .then(() => prisma.tag.findMany());
  podcastData.forEach(async (podcast) => {
    await prisma.podcast.create({
      data: {
        ...podcast,
        publishedAt: new Date(),
        authors: {
          createMany: {
            data: users.map(({ id: userId }) => ({
              authorId: userId,
              identity:
                Math.random() > 0.5
                  ? PodcastIdentity.Guest
                  : PodcastIdentity.Host,
            })),
          },
        },
        tags: {
          createMany: {
            data: tags.map(({ id: tagId }) => ({
              tagId,
            })),
          },
        },
      },
    });
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
