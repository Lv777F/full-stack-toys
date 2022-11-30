import { CursorBasedPaginationInput } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { forkJoin, from, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PodcastsService {
  constructor(private prisma: PrismaService) {}

  getPaginatedPodcasts(
    { cursor, limit = 5 }: CursorBasedPaginationInput,
    relations: string[],
    where?: Prisma.PodcastWhereInput,
    orderBy: Prisma.PodcastOrderByWithAggregationInput = { id: 'desc' }
  ) {
    return forkJoin([
      from(
        this.prisma.podcast.findMany({
          skip: cursor ? 1 : 0,
          take: limit + 1,
          where,
          orderBy,
          include: {
            authors: relations.includes('authors') && {
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
            },
            tags: relations.includes('tags') && {
              include: {
                tag: true,
              },
            },
          },
        })
      ),
      // prisma 不支持查询同时统计
      from(this.prisma.podcast.count({ where })),
    ]).pipe(
      map(([nodes, totalCount]) => ({
        nodes: nodes.slice(0, limit),
        hasNextPage: !!nodes[limit + 1],
        totalCount,
      }))
    );
  }

  findOne(id: number, relations: string[]) {
    return from(
      this.prisma.podcast.findFirst({
        where: { id },
        include: {
          authors: {
            include: {
              author: relations.includes('authors') && {
                select: {
                  id: true,
                  name: true,
                  profile: true,
                  status: true,
                },
              },
            },
          },
          tags: relations.includes('tags') && {
            include: {
              tag: true,
            },
          },
        },
      })
    );
  }
}
