import { NotFoundError } from '@full-stack-toys/api-interface';
import { CursorBasedPaginationInput } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { forkJoin, from, map, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const PODCAST_INCLUDE_AUTHORS_ARG = {
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

  /**
   * 获取分页播客
   *
   * @param pagination 分页依据
   * @param relations 关联字段
   * @param where 过滤条件
   * @param orderBy 排序规则
   *
   * @returns 基于游标分页的播客数据
   */
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
          cursor: cursor ? { id: +cursor } : undefined,
          where,
          orderBy,
          include: {
            authors:
              relations.includes('authors') && PODCAST_INCLUDE_AUTHORS_ARG,
            tags: relations.includes('tags') && {
              include: {
                tag: true,
              },
            },
          },
        })
      ),
      from(this.prisma.podcast.count({ where })),
    ]).pipe(
      map(([nodes, totalCount]) => ({
        nodes: nodes.slice(0, limit),
        hasNextPage: !!nodes[limit],
        totalCount,
      }))
    );
  }

  /**
   * 获取指定播客
   *
   * @param id
   * @param relations 关联字段
   * @param where
   *
   * @returns
   */
  findOne(id: number, relations: string[], where?: Prisma.PodcastWhereInput) {
    return from(
      this.prisma.podcast.findUnique({
        where: { id, AND: [where] },
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
      tap((podcast) => {
        if (!podcast) throw new NotFoundError('未找到播客');
      })
    );
  }
}
