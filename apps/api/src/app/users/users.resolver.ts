import { PaginatedPodcast, User } from '@full-stack-toys/dto';
import { HasFields, Selections } from '@jenyus-org/nestjs-graphql-utils';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { forkJoin, map } from 'rxjs';
import { JwtAuthGuard } from '../auth/guard';
import { PodcastsService } from '../podcasts/podcasts.service';
import { CurrentUserId } from './get-user.decorator';
import { UsersService } from './users.service';
@Resolver(() => User)
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private podcastsService: PodcastsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { description: '当前账号的用户信息' })
  me(@CurrentUserId() userId: User['id']) {
    return this.usersService.findOne(userId);
  }

  @Query(() => User, { description: '指定 id 的用户信息' })
  user(
    @Args('id', { type: () => Int, description: '用户' }) userId: User['id']
  ) {
    return this.usersService.findOne(userId);
  }

  @ResolveField(() => PaginatedPodcast, { description: '用户相关播客' })
  podcasts(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 5, nullable: true })
    limit: number,
    @Selections('podcasts.nodes', ['**']) relations: string[],
    @HasFields('podcasts.totalCount') withTotalCount: boolean
  ) {
    const whereInput = {
      published: true,
      authors: {
        some: {
          authorId: user.id,
        },
      },
    };
    return forkJoin([
      this.podcastsService.findMany({ limit }, relations, whereInput),
      ...(withTotalCount ? [this.podcastsService.count(whereInput)] : []),
    ]).pipe(
      map(([data, totalCount = 0]) => ({
        ...data,
        totalCount,
      }))
    );
  }
}
