import { SignupDTO } from '@full-stack-toys/dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType, User, UserToken } from '@prisma/client';
import * as argon2 from 'argon2';
import { delayWhen, exhaustMap, forkJoin, from, map, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  generateTokens(userId: User['id']) {
    return forkJoin([
      from(
        this.jwtService.signAsync(
          { sub: userId },
          {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
          }
        )
      ),
      from(
        this.jwtService.signAsync(
          { sub: userId },
          {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
          }
        )
      ),
    ]).pipe(
      map(([accessToken, refreshToken]) => ({ accessToken, refreshToken }))
    );
  }

  login(userId: User['id']) {
    return this.generateTokens(userId).pipe(
      delayWhen(({ refreshToken }) =>
        from(
          this.prisma.userToken.create({
            data: {
              userId,
              token: refreshToken,
              type: TokenType.Refresh,
            },
          })
        )
      )
    );
  }

  refresh(userId: User['id'], token: UserToken['token']) {
    return this.generateTokens(userId).pipe(
      delayWhen(({ refreshToken }) =>
        from(
          this.prisma.userToken.update({
            where: {
              userId_token: {
                userId,
                token,
              },
            },
            data: {
              token: refreshToken,
            },
          })
        )
      )
    );
  }

  signup({ password, ...userInfo }: SignupDTO) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      exhaustMap((hash) => this.userService.createUser({ ...userInfo, hash })),
      exhaustMap(({ id }) => this.login(id))
    );
  }

  validateUserToken(
    tokenType: TokenType,
    userId: User['id'],
    token: UserToken['token']
  ) {
    return from(
      this.prisma.userToken.findUnique({
        where: {
          userId_token: {
            userId,
            token,
          },
        },
        include: {
          user: true,
        },
      })
    ).pipe(
      tap((userToken) => {
        if (!userToken) throw new ForbiddenException('凭据无效');
        if (userToken.type !== tokenType)
          throw new ForbiddenException('凭据类型错误');
      }),
      map(({ user }) => user),
      this.userService.desensitize()
    );
  }

  deleteToken(userId: User['id'], token: UserToken['token']) {
    return from(
      this.prisma.userToken.delete({
        where: {
          userId_token: {
            userId,
            token,
          },
        },
      })
    );
  }
}
