import { SignupDTO } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { exhaustMap, from, map } from 'rxjs';
import { UserService } from '../user/user.service';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  signToken({ email, id }: { email: User['email']; id: User['id'] }) {
    return { accessToken: this.jwtService.sign({ email, sub: id }) };
  }

  signup({ password, ...userInfo }: SignupDTO) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      exhaustMap((hash) => this.userService.createUser({ ...userInfo, hash })),
      map(this.signToken)
    );
  }
}
