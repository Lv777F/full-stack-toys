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

@Resolver()
export class PodcastsResolver {
  constructor(private podcastsService: PodcastsService) {}
  @Query(() => PaginatedPodcast, { description: '分页获取播客' })
  podcasts(
    @Args('pagination') pagination: CursorBasedPaginationInput,
    @Selections('podcasts.nodes', ['**']) relations: string[],
    @Args('filters', { nullable: true }) where?: PodcastWhereInput,
    @Args('sort', { nullable: true }) orderBy?: PodcastOrderByInput
  ) {
    const whereMap: Record<
      keyof PodcastWhereInput,
      (
        v: PodcastWhereInput[keyof PodcastWhereInput]
      ) => Prisma.PodcastWhereInput
    > = {
      keyword: (contains: string) => ({
        OR: {
          title: { contains },
          showNote: {
            contains,
          },
        },
      }),
      includeAuthors: (v: number[]) => ({
        authors: {
          some: { authorId: { in: v } },
        },
      }),
      includeTags: () => ({}),
      publishedDateRange: () => ({}),
    };

    return this.podcastsService.getPaginatedPodcasts(
      pagination,
      relations,
      Object.entries(where)
        .map(([key, value]) => whereMap[key](value))
        .reduce((acc, cur) => ({ ...acc, ...cur }), {}),
      orderBy
    );
  }
}
