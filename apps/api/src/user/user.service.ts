import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { catchError, delayWhen, from, map, pipe, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  desensitize() {
    return pipe(map(({ refreshToken, hash, ...user }: User) => user));
  }

  createUser(user: Pick<User, 'email' | 'name'> & { hash?: User['hash'] }) {
    return from(
      this.prisma.user.create({
        data: {
          ...user,
        },
      })
    ).pipe(
      catchError((err) => {
        if (err instanceof PrismaClientKnownRequestError) {
          if (err.code === 'P2002')
            throw new UnprocessableEntityException('邮箱已注册');
        }
        throw err;
      }),
      this.desensitize()
    );
  }

  getUserById(id: User['id']) {
    return from(
      this.prisma.user.findUnique({
        where: {
          id,
        },
      })
    ).pipe(this.desensitize());
  }

  validateUser(email: User['email'], password: string) {
    return from(
      this.prisma.user.findUnique({
        where: {
          email,
        },
      })
    ).pipe(
      delayWhen((user) => {
        if (!user) throw new ForbiddenException('邮箱或密码错误');

        return from(argon2.verify(user.hash, password)).pipe(
          tap((result) => {
            if (!result) throw new ForbiddenException('邮箱或密码错误');
          })
        );
      }),
      this.desensitize()
    );
  }

  checkRefreshToken(id: User['id'], refreshToken: string) {
    return from(
      this.prisma.user.findUnique({
        where: { id },
      })
    ).pipe(
      tap((user) => {
        if (user.refreshToken !== refreshToken)
          throw new ForbiddenException('身份凭据已过期');
      }),
      this.desensitize()
    );
  }

  updateRefreshToken(id: User['id'], refreshToken: string | null) {
    return from(
      this.prisma.user.update({
        where: {
          id,
        },
        data: {
          refreshToken,
        },
      })
    ).pipe(this.desensitize());
  }
}
