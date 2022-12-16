import {
  DuplicateError,
  NotFoundError,
  RedisKey,
  UnAuthorizedError,
  ValidationError,
} from '@full-stack-toys/api-interface';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { Redis } from 'ioredis';
import {
  catchError,
  delayWhen,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { UsersService } from '../users/users.service';
import { RequestUser } from './decorator';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRedis() private redis: Redis
  ) {}

  /**
   * 校验用户名和密码
   *
   * @param username 用户名
   * @param password 密码
   *
   * @returns 包含 userId 的对象, 用于 passport 携带到 req 中
   */
  validateUser(username: User['username'], password: string) {
    return this.usersService.findOneByUsername(username).pipe(
      delayWhen(({ hash }) =>
        // 校验密码与 hash
        from(argon2.verify(hash, password)).pipe(
          tap((result) => {
            if (!result) throw new ValidationError('密码不正确');
          })
        )
      ),
      map(({ id, role }) => ({ id, role }))
    );
  }

  /**
   * 生成 accessToken & refreshToken
   *
   * @param userId
   *
   * @returns tokens
   */
  signTokens({ id: userId, role }: RequestUser) {
    return forkJoin([
      from(
        this.jwtService.signAsync(
          { sub: userId, role },
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

  /**
   * 注册
   *
   * @param inviteCode
   * @param userData
   *
   * @returns tokens
   */
  signUp(
    inviteCode: string,
    {
      password,
      ...userInfo
    }: Omit<Prisma.UserUpdateInput, 'hash'> & { password: string }
  ) {
    return from(this.redis.hgetall(RedisKey.InviteCodes)).pipe(
      map((inviteCodes) =>
        Object.keys(inviteCodes).find(
          (userId) => inviteCodes[userId] === inviteCode
        )
      ),
      tap((userId) => {
        if (!userId) throw new UnAuthorizedError('凭证过期或无效');
      }),
      switchMap((userId) =>
        from(argon2.hash(password)).pipe(
          switchMap((hash) =>
            this.usersService
              .update(+userId, { ...userInfo, hash }, { username: null })
              .pipe(
                catchError((err) => {
                  if (err instanceof PrismaClientKnownRequestError) {
                    if (err.code === 'P2002')
                      throw new DuplicateError('用户名已注册');
                    if (err.code === 'P2025') {
                      this.redis.hdel(RedisKey.InviteCodes, userId);
                      throw new NotFoundError('该用户已完成注册');
                    }
                  }
                  throw err;
                })
              )
          )
        )
      ),
      tap(({ id }) => this.redis.hdel(RedisKey.InviteCodes, id + '')),
      switchMap(({ id, role }) => this.signTokens({ id, role }))
    );
  }

  /**
   * 刷新 token
   *
   * @param userId
   * @param token 当前 refreshToken
   *
   * @returns tokens
   */
  refresh(userId: User['id'], token: string) {
    // 重新获取用户 role 并授权
    return this.usersService.findOne(userId).pipe(
      switchMap(({ role }) => this.signTokens({ id: userId, role })),
      // 使当前使用的 refreshToken 失效
      delayWhen(() => this.logout(userId, token))
    );
  }

  /**
   * 失效当前 refreshToken
   *
   * @param token
   *
   * @returns
   */
  logout(userId: User['id'], token: string) {
    return of(RedisKey.RefreshTokenBlacklist.replace('{id}', userId + '')).pipe(
      switchMap((blacklistKey) =>
        from(
          this.redis
            .multi()
            .sadd(blacklistKey, token)
            .expire(blacklistKey, '7d')
            .exec()
        )
      )
    );
  }
}
