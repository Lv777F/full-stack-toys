import { User } from '@full-stack-toys/dto';
import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guard';
import { CurrentUserId } from './get-user.decorator';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

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
}
