import { SignupDTO } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { delayWhen, exhaustMap, forkJoin, from, map } from 'rxjs';
import { UserService } from '../user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  signToken({ email, id }: { email: User['email']; id: User['id'] }) {
    return forkJoin([
      from(
        this.jwtService.signAsync(
          { email, sub: id },
          {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '15m',
          }
        )
      ),
      from(
        this.jwtService.signAsync(
          { email, sub: id },
          {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
          }
        )
      ).pipe(
        delayWhen((refreshToken) =>
          this.userService.updateRefreshToken(id, refreshToken)
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
      map(this.signToken.bind(this))
    );
  }

  logout(userId: User['id']) {
    return this.userService.updateRefreshToken(userId, null);
  }
}
