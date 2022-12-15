import {
  DuplicateError,
  TargetNotFoundError,
  UnAuthorizedError,
} from '@full-stack-toys/api-interface';
import { Credentials, LoginInput, SignUpInput } from '@full-stack-toys/dto';
import {
  BadRequestException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { catchError, map } from 'rxjs';
import { AuthService } from './auth.service';
import { CurrentUser, RequestUser } from './decorator';
import { JwtRefreshAuthGuard, LocalAuthGuard } from './guard';

@Resolver(() => Credentials)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Mutation(() => Credentials, { description: '登录' })
  login(@Args('loginInput') _: LoginInput, @CurrentUser() user: RequestUser) {
    return this.authService.signTokens(user);
  }

  @Mutation(() => Credentials, {
    description: '只开放邀请注册 需要提供 inviteCode',
  })
  signUp(
    @Args({
      name: 'inviteCode',
      description: '邀请码',
    })
    inviteCode: string,
    @Args('signUpInput') signUpInput: SignUpInput
  ) {
    return this.authService
      .signUp(inviteCode, {
        ...signUpInput,
        name: signUpInput.name || signUpInput.username,
      })
      .pipe(
        catchError((err) => {
          if (
            err instanceof DuplicateError ||
            err instanceof TargetNotFoundError
          )
            throw new BadRequestException(err.message);
          if (err instanceof UnAuthorizedError)
            throw new UnauthorizedException(err.message);
          throw err;
        })
      );
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
  logout(@Context() context, @CurrentUser('id') userId: RequestUser['id']) {
    return this.authService
      .logout(
        userId,
        context.req.header('Authorization').replace('Bearer ', '')
      )
      .pipe(map(() => true));
  }
}
