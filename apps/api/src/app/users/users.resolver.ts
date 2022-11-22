import { PaginatedPodcast, User } from '@full-stack-toys/dto';
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
import { CurrentUserId } from './get-user.decorator';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private userService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { description: '当前账号的用户信息' })
  me(@CurrentUserId() userId: User['id']) {
    return this.userService.findOne(userId);
  }

  @Query(() => User, { description: '指定 id 的用户信息' })
  user(@Args('id', { type: () => Int }) userId: User['id']) {
    return this.userService.findOne(userId);
  }

  @ResolveField(() => PaginatedPodcast, { description: '用户关联的播客' })
  podcasts(@Parent() user: User) {
    console.log(user);
  }
}
