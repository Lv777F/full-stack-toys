import { Credentials, LoginInput, SignUpInput } from '@full-stack-toys/dto';
import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  GqlExecutionContext,
  Mutation,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { User } from '@prisma/client';
import { map } from 'rxjs';
import { CurrentUserId } from '../users/get-user.decorator';
import { AuthService } from './auth.service';
import { JwtRefreshAuthGuard, LocalAuthGuard } from './guard';

@Resolver((of) => Credentials)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Mutation((returns) => Credentials, { description: '登录' })
  login(
    @Args('loginInput') _: LoginInput,
    @CurrentUserId() userId: User['id']
  ) {
    return this.authService.login(userId);
  }

  @Mutation((returns) => Credentials, { description: '注册' })
  signup(@Args('signUpInput') signUpInput: SignUpInput) {
    return this.authService.signUp(signUpInput);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Mutation((returns) => Credentials, {
    description: '刷新 token, 需要携带 refreshToken 作为 Bearer Token',
  })
  refresh(
    @CurrentUserId() userId: User['id'],
    @Context() context: GqlExecutionContext
  ) {
    return this.authService.refresh(
      userId,
      (context as any).req.header('Authorization').replace('Bearer ', '')
    );
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Mutation((returns) => Boolean, { description: '登出' })
  logout(@Context() context: GqlExecutionContext) {
    return this.authService
      .logout(
        (context as any).req.header('Authorization').replace('Bearer ', '')
      )
      .pipe(map(() => true));
  }

  @Query(() => String)
  _() {
    return 'Hello stranger!';
  }
}
