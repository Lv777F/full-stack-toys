import { LoginDTO, SignupDTO } from '@full-stack-toys/dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
export class AuthService {
  constructor(private prisma: PrismaService) {}

  login({ email, password }: LoginDTO) {
    return from(
      // 根据邮箱获取用户
      this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          hash: true,
          email: true,
          id: true,
        },
      })
    ).pipe(
      filter(Boolean),
      // 未查询到用户
      throwIfEmpty(
        () => new HttpException('用户名或密码不正确', HttpStatus.FORBIDDEN)
      ),
      exhaustMap((user) =>
        from(argon2.verify(user.hash, password)).pipe(
          exhaustMap((verifyResult) =>
            // TODO 返回token
            verifyResult
              ? of(user.id)
              : throwError(
                  () =>
                    new HttpException(
                      '用户名或密码不正确',
                      HttpStatus.FORBIDDEN
                    )
                )
          )
        )
      )
    );
  }

  signup({ password, ...userInfo }: SignupDTO) {
    // 转换密码为哈希保存
    return from(argon2.hash(password)).pipe(
      exhaustMap((hash) =>
        from(
          // 创建用户
          this.prisma.user.create({
            data: {
              ...userInfo,
              hash,
            },
          })
        ).pipe(
          catchError((err) => {
            if (err instanceof PrismaClientKnownRequestError) {
              // P2002: 字段不符合unique规则
              if (err.code === 'P2002')
                return throwError(
                  () =>
                    new HttpException(
                      '邮箱已注册',
                      HttpStatus.UNPROCESSABLE_ENTITY
                    )
                );
            }
            return throwError(() => err);
          }),
          map(
            ({ hash: _, ...user }) =>
              // TODO 返回token
              user
          )
        )
      )
    );
  }
}
