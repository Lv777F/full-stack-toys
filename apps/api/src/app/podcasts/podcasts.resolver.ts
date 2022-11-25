import {
  CursorBasedPaginationInput,
  PaginatedPodcast,
  PodcastOrderByInput,
  PodcastWhereInput,
} from '@full-stack-toys/dto';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { PodcastsService } from './podcasts.service';

const whereMap: Record<
  keyof PodcastWhereInput,
  (v: PodcastWhereInput[keyof PodcastWhereInput]) => Prisma.PodcastWhereInput
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
  includeAuthors: (authorIds: number[]) => ({
    AND: authorIds.map((authorId) => ({
      authors: {
        some: {
          authorId: { equals: authorId },
        },
      },
    })),
  }),
  includeTags: (tagIds: number[]) => ({
    AND: tagIds.map((tagId) => ({
      tags: {
        some: {
          tagId: { equals: tagId },
        },
      },
    })),
  }),
  publishedDateRange: ([startDate, endDate]: [Date, Date]) => ({
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
    @Args('filters', { nullable: true })
    whereInput?: PodcastWhereInput,
    @Args('sorts', { nullable: true }) orderBy?: PodcastOrderByInput
  ) {
    return this.podcastsService.getPaginatedPodcasts(
      pagination,
      relations,
      {
        AND: Object.entries(whereInput ?? {}).map(([key, value]) =>
          whereMap[key](value)
        ),
        published: true,
      },
      orderBy
    );
  }
}
