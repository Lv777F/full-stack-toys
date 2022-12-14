import { PodcastIdentity, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
const prisma = new PrismaClient();

const podcastData = [...Array(50)].map((_, i) => ({
  title: `第 ${i} 期`,
  published: Math.random() > 0.2,
  showNote: `第 ${i} 期 showNote`,
}));

const userData = [
  {
    username: 'franky',
    role: Role.Admin,
  },
  {
    username: 'cabbage',
    role: Role.Admin,
  },
  {
    username: 'xinbao',
    role: Role.Admin,
  },
  ...Array(30)
    .fill(null)
    .map((_, i) => ({
      username: `test${i + 1}`,
      role: Role.Contributor,
    })),
];

const tagData = [
  {
    name: 'JS',
  },
  { name: 'HTML' },
  { name: 'CSS' },
  { name: 'Vue' },
  { name: 'React' },
  { name: 'Angular' },
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
      data: userData.map((user) => ({ ...user, hash, name: user.username })),
      skipDuplicates: true,
    })
    .then(() => prisma.user.findMany());

  const tags = await prisma.tag
    .createMany({
      data: tagData,
    })
    .then(() => prisma.tag.findMany());
  podcastData.forEach(async (podcast) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.random() * 20);
    await prisma.podcast.create({
      data: {
        ...podcast,
        publishedAt: date,
        authors: {
          createMany: {
            data: users
              .flatMap((item) => (Math.random() > 0.3 ? [item] : []))
              .map(({ id: userId }) => ({
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
            data: tags
              .flatMap((item) => (Math.random() > 0.5 ? [item] : []))
              .map(({ id: tagId }) => ({
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
