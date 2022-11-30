import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { Cache } from 'cache-manager';
import { delayWhen, exhaustMap, forkJoin, from, map, tap } from 'rxjs';
import { UsersService } from '../users/users.service';
import { RequestUser } from './decorator';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  /**
   * 校验用户名和密码
   *
   * @param email 邮箱
   * @param password 密码
   *
   * @returns 包含 userId 的对象, 用于 passport 携带到 req 中
   */
  validateUser(email: User['email'], password: string) {
    return this.usersService.findOneByEmail(email).pipe(
      tap((user) => {
        if (!user) throw new UnauthorizedException('用户名或密码错误');
      }),
      delayWhen(({ hash }) =>
        // 校验密码与 hash
        from(argon2.verify(hash, password)).pipe(
          tap((result) => {
            if (!result) throw new UnauthorizedException('用户名或密码错误');
          })
        )
      ),
      map(({ id, roles }) => ({ id, roles }))
    );
  }

  /**
   * 生成 accessToken & refreshToken
   *
   * @param userId
   *
   * @returns tokens
   */
  generateTokens({ id: userId, roles }: RequestUser) {
    return forkJoin([
      from(
        this.jwtService.signAsync(
          { sub: userId, roles },
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
  }: Pick<User, 'name' | 'email'> & { password: string }) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      exhaustMap((hash) => this.usersService.create({ ...userInfo, hash })),
      exhaustMap(({ id, roles }) => this.login({ id, roles }))
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
    // 重新获取用户 roles 并授权
    return this.usersService.findOne(userId).pipe(
      exhaustMap(({ roles }) => this.generateTokens({ id: userId, roles })),
      // 使当前使用的 refreshToken 失效
      delayWhen(() => this.logout(token))
    );
  }

  /**
   * 失效当前 refreshToken
   *
   * @param token
   *
   * @returns
   */
  logout(token: string) {
    // 添加当前 token 到 redis 黑名单
    return from(this.cacheService.set(`bl_${token}`, true));
  }

  /**
   * 判断当前 token 是否有效 ( 不在 redis 黑名单中 )
   *
   * @param token
   *
   * @returns redis 查询结果
   */
  checkToken(token: string) {
    return from(this.cacheService.get(`bl_${token}`)).pipe(map((r) => !r));
  }
}
