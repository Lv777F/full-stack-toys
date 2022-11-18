import { SignupDTO } from '@full-stack-toys/dto';
import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { Cache } from 'cache-manager';
import { delayWhen, exhaustMap, forkJoin, from, map, tap } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  validateUser(email: User['email'], password: string) {
    return this.userService.getUserByEmail(email).pipe(
      tap((user) => {
        if (!user) throw new ForbiddenException('邮箱或密码错误');
      }),
      delayWhen(({ hash }) =>
        from(argon2.verify(hash, password)).pipe(
          tap((result) => {
            if (!result) throw new ForbiddenException('邮箱或密码错误');
          })
        )
      ),
      map(({ id }) => ({ id }))
    );
  }

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

  signup({ password, ...userInfo }: SignupDTO) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      exhaustMap((hash) => this.userService.createUser({ ...userInfo, hash })),
      exhaustMap(({ id }) => this.login(id))
    );
  }

  login(userId: User['id']) {
    return this.generateTokens(userId);
  }

  refresh(userId: User['id'], token: string) {
    return this.generateTokens(userId).pipe(
      delayWhen(() => this.logout(token))
    );
  }

  logout(token: string) {
    return from(this.cacheService.set(`bl_${token}`, true));
  }

  checkToken(token: string) {
    return from(this.cacheService.get(`bl_${token}`)).pipe(map((r) => !r));
  }
}
