import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import {
  catchError,
  exhaustMap,
  filter,
  from,
  map,
  of,
  throwError,
  throwIfEmpty,
} from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
          // P2002: 字段不符合unique规则
          if (err.code === 'P2002')
            return throwError(
              () => new UnprocessableEntityException('邮箱已注册')
            );
        }
        return throwError(() => err);
      }),
      map(({ hash: _, ...user }: User) => user)
    );
  }

  getUserById(id: User['id']) {
    return from(
      this.prisma.user.findUnique({
        where: {
          id,
        },
      })
    ).pipe(map(({ hash: _, ...user }: User) => user));
  }

  validateUser(email: User['email'], password: string) {
    return from(
      this.prisma.user.findUnique({
        where: {
          email,
        },
      })
    ).pipe(
      exhaustMap((user) =>
        user
          ? from(argon2.verify(user.hash, password)).pipe(
              map((result) => (result ? user : null))
            )
          : of(null)
      ),
      filter(Boolean),
      throwIfEmpty(() => new ForbiddenException('邮箱或密码错误')),
      map(({ hash: _, ...user }) => user)
    );
  }
}
