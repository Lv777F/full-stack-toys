import { RedisKey, ValidationError } from '@full-stack-toys/api-interface';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { Redis } from 'ioredis';
import { delayWhen, forkJoin, from, map, of, switchMap, tap } from 'rxjs';
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
  generateTokens({ id: userId, role }: RequestUser) {
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
   * @param userData 注册必须信息
   *
   * @returns tokens
   */
  signUp({
    password,
    ...userInfo
  }: Omit<Prisma.UserCreateInput, 'hash'> & { password: string }) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      switchMap((hash) => this.usersService.create({ ...userInfo, hash })),
      switchMap(({ id, role }) => this.login({ id, role }))
    );
  }

  /**
   * 登录
   *
   * @param user
   *
   * @returns tokens
   */
  login(user: RequestUser) {
    return this.generateTokens(user);
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
      switchMap(({ role }) => this.generateTokens({ id: userId, role })),
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
    const blacklistKey = RedisKey.RefreshTokenBlacklist.replace(
      '{id}',
      userId + ''
    );
    return from(
      this.redis
        .multi()
        .sadd(blacklistKey, token)
        .expire(blacklistKey, '7d')
        .exec()
    );
  }

  inviteUser(userId: User['id']) {
    return of(Math.random().toString(36).substring(2)).pipe(
      delayWhen((tempToken) =>
        from(this.redis.hset(RedisKey.SignUpTempTokens, userId + '', tempToken))
      )
    );
  }
}
