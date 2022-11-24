import { PaginatedPodcast, User } from '@full-stack-toys/dto';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
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
    @Parent() { id: userId }: User,
    @Args('limit', { type: () => Int, defaultValue: 5, nullable: true })
    limit: number,
    @Selections('podcasts.nodes', ['**']) relations: string[]
  ) {
    return this.podcastsService.getPaginatedPodcasts({ limit }, relations, {
      published: true,
      authors: {
        some: {
          authorId: userId,
        },
      },
    });
  }
}
