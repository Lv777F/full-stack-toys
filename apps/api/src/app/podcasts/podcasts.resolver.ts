import { accessibleBy } from '@casl/prisma';
import { NotFoundError } from '@full-stack-toys/api-interface';
import {
  CursorBasedPaginationInput,
  PaginatedPodcasts,
  Podcast,
  PodcastOrderByInput,
  PodcastWhereInput,
  Tag,
  User,
} from '@full-stack-toys/dto';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { catchError } from 'rxjs';
import { AllowAnonymous, CurrentUser, RequestUser } from '../auth/decorator';
import { JwtAuthGuard } from '../auth/guard';
import { Action, CaslAbilityFactory } from '../casl/casl-ability.factory';
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
  authors: (authorIds: User['id'][]) => ({
    AND: authorIds.map((authorId) => ({
      authors: {
        some: {
          authorId: { equals: +authorId },
        },
      },
    })),
  }),
  tags: (tagIds: Tag['id'][]) => ({
    AND: tagIds.map((tagId) => ({
      tags: {
        some: {
          tagId: { equals: +tagId },
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

@Resolver(() => Podcast)
@UseGuards(JwtAuthGuard)
export class PodcastsResolver {
  constructor(
    private podcastsService: PodcastsService,
    private abilityFactory: CaslAbilityFactory
  ) {}

  @AllowAnonymous()
  @Query(() => PaginatedPodcasts, { description: '分页获取播客数据' })
  podcasts(
    @Args('pagination') pagination: CursorBasedPaginationInput,
    @Selections('podcasts.nodes', ['**']) relations: string[],
    @Args('filters', { nullable: true }) whereInput?: PodcastWhereInput,
    @Args('sorts', { nullable: true }) orderBy?: PodcastOrderByInput,
    @CurrentUser() user?: RequestUser
  ) {
    return this.podcastsService.getPaginatedPodcasts(
      pagination,
      relations,
      {
        AND: [
          ...Object.entries(whereInput ?? {}).map(
            ([key, value]) => whereMap[key]?.(value) ?? { [key]: value }
          ),
          accessibleBy(this.abilityFactory.createAbility(user), Action.Read)
            .Podcast,
        ],
      },
      orderBy
    );
  }

  @AllowAnonymous()
  @Query(() => Podcast, { description: '获取指定播客数据' })
  podcast(
    @Args('id', { type: () => ID }) id: Podcast['id'],
    @Selections('podcast', ['**']) relations: string[],
    @CurrentUser() user?: RequestUser
  ) {
    return this.podcastsService
      .findOne(
        +id,
        relations,
        accessibleBy(this.abilityFactory.createAbility(user), Action.Read)
          .Podcast
      )
      .pipe(
        catchError((err) => {
          if (err instanceof NotFoundError)
            throw new NotFoundException('播客不存在或没有权限查看');

          throw err;
        })
      );
  }

  @Mutation(() => Podcast)
  createPodcast() {
    return {};
  }
}
