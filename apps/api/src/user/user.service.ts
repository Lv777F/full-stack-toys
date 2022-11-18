import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { catchError, from, map, pipe } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  desensitize() {
    return pipe(map(({ hash, ...user }: User) => user));
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

  getUserByEmail(email: User['email']) {
    return from(
      this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          hash: true,
          id: true,
        },
      })
    );
  }
}
