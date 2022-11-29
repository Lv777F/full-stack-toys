import { Credentials, LoginInput, SignUpInput } from '@full-stack-toys/dto';
import { UseGuards } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { map } from 'rxjs';
import { CurrentUser, RequestUser } from '../users/get-user.decorator';
import { AuthService } from './auth.service';
import { JwtRefreshAuthGuard, LocalAuthGuard } from './guard';

@Resolver(() => Credentials)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Mutation(() => Credentials, { description: '登录' })
  login(@Args('loginInput') _: LoginInput, @CurrentUser() user: RequestUser) {
    return this.authService.login(user);
  }

  @Mutation(() => Credentials, { description: '注册' })
  signUp(@Args('signUpInput') signUpInput: SignUpInput) {
    return this.authService.signUp(signUpInput);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Mutation(() => Credentials, {
    description: '刷新 Token, 需要传递 RefreshToken 作为 Bearer Token',
  })
  refresh(@CurrentUser('id') userId: RequestUser['id'], @Context() context) {
    return this.authService.refresh(
      userId,
      context.req.header('Authorization').replace('Bearer ', '')
    );
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Mutation(() => Boolean, {
    description: '登出, 需要传递 RefreshToken 作为 Bearer Token',
  })
  logout(@Context() context) {
    return this.authService
      .logout(context.req.header('Authorization').replace('Bearer ', ''))
      .pipe(map(() => true));
  }

  @Query(() => String, { deprecationReason: '没啥用, 语法要求必须有个 Query' })
  _() {
    return 'Hello stranger!';
  }
}
