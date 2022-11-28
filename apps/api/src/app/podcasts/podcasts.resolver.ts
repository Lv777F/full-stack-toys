import {
  CursorBasedPaginationInput,
  PaginatedPodcast,
  Podcast,
  PodcastOrderByInput,
  PodcastWhereInput,
} from '@full-stack-toys/dto';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { PodcastsService } from './podcasts.service';

const whereMap: Partial<
  Record<
    keyof PodcastWhereInput,
    (v: PodcastWhereInput[keyof PodcastWhereInput]) => Prisma.PodcastWhereInput
  >
> = {
  keyword: (contains: string) => ({
    OR: [
      { title: { contains } },
      {
        showNote: {
          contains,
        },
      },
    ],
  }),
  authors: (authorIds: number[]) => ({
    AND: authorIds.map((authorId) => ({
      authors: {
        some: {
          authorId: { equals: authorId },
        },
      },
    })),
  }),
  tags: (tagIds: number[]) => ({
    AND: tagIds.map((tagId) => ({
      tags: {
        some: {
          tagId: { equals: tagId },
        },
      },
    })),
  }),
  publishedDate: ([startDate, endDate]: [Date, Date]) => ({
    publishedAt: {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    },
  }),
};

@Resolver()
export class PodcastsResolver {
  constructor(private podcastsService: PodcastsService) {}

  @Query(() => PaginatedPodcast, { description: '分页获取播客数据' })
  podcasts(
    @Args('pagination') pagination: CursorBasedPaginationInput,
    @Selections('podcasts.nodes', ['**']) relations: string[],
    @Args('filters', { nullable: true }) whereInput?: PodcastWhereInput,
    @Args('sorts', { nullable: true }) orderBy?: PodcastOrderByInput
  ) {
    return this.podcastsService.getPaginatedPodcasts(
      pagination,
      relations,
      {
        AND: Object.entries(whereInput ?? {}).map(
          ([key, value]) => whereMap[key]?.(value) ?? { [key]: value }
        ),
      },
      orderBy
    );
  }

  @Query(() => Podcast, { description: '获取指定播客数据' })
  podcast(
    @Args('id', { type: () => Int }) id: number,
    @Selections('podcast', ['**']) relations: string[]
  ) {
    // TODO 未发布播客权限验证
    return this.podcastsService.findOne(id, relations);
  }
}
