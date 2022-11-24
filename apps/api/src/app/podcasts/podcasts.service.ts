import { CursorBasedPaginationInput } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { from, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
const PODCAST_INCLUDE_AUTHORS_ARG: Prisma.PodcastAuthorFindManyArgs = {
  include: {
    author: {
      select: {
        id: true,
        name: true,
        profile: true,
        status: true,
      },
    },
  },
};
@Injectable()
export class PodcastsService {
  constructor(private prisma: PrismaService) {}

  findMany(
    { cursor, limit = 5 }: CursorBasedPaginationInput,
    relations: string[],
    whereInput: Prisma.PodcastWhereInput,
    orderBy: Prisma.PodcastOrderByWithAggregationInput = { id: 'desc' }
  ) {
    const where = whereInput;

    return from(
      this.prisma.podcast.findMany({
        skip: cursor ? 1 : 0,
        take: limit + 1,
        where,
        orderBy,
        include: {
          authors: relations.includes('authors') && PODCAST_INCLUDE_AUTHORS_ARG,
          tags: relations.includes('tags') && {
            include: {
              tag: true,
            },
          },
        },
      })
    ).pipe(
      map((nodes) => ({
        nodes: nodes.slice(0, limit),
        hasNextPage: !!nodes[limit + 1],
      }))
    );
  }

  count(where: Prisma.PodcastWhereInput) {
    return from(this.prisma.podcast.count({ where }));
  }
}
