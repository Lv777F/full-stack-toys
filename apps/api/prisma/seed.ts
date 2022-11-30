import { PodcastIdentity, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
const prisma = new PrismaClient();

const podcastData = [
  {
    title: '第一期',
    published: true,
    showNote: '第一期',
  },
  {
    title: '第二期',
    published: false,
    showNote: '第二期',
  },
  {
    title: '第三期',
    published: true,
    showNote: '第三期',
  },
  {
    title: '第四期',
    published: true,
    showNote: '第四期',
  },
  {
    title: '第五期',
    published: true,
    showNote: '第五期',
  },
  {
    title: '第六期',
    published: false,
    showNote: '第六期',
  },
];

const userData = [
  {
    name: 'franky',
    email: 'q404023244@gmail.com',
    roles: [Role.Admin],
  },
  {
    name: 'cabbage',
    email: 'test1@gmail.com',
    roles: [Role.Contributor],
  },
  {
    name: 'xinbao',
    email: 'test2@gmail.com',
    roles: [Role.Admin],
  },
  {
    name: 'normal',
    email: 'test3@gmail.com',
    roles: [],
  },
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
    const date = new Date();
    date.setDate(date.getDate() - Math.random() * 20);
    await prisma.podcast.create({
      data: {
        ...podcast,
        publishedAt: date,
        authors: {
          createMany: {
            data: users
              .filter(({ roles }) => roles.length > 0)
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
