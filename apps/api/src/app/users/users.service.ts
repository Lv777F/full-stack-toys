import { NotFoundError, RedisKey } from '@full-stack-toys/api-interface';
import { OffsetBasedPaginationInput } from '@full-stack-toys/dto';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { Redis } from 'ioredis';
import {
  catchError,
  delayWhen,
  forkJoin,
  from,
  map,
  of,
  pipe,
  tap,
} from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 对用户信息进行脱敏的 rxjs 管道
 */
const desensitize = () => pipe(map(({ hash: _, ...user }: User) => user));

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @InjectRedis() private redis: Redis
  ) {}

  /**
   * 创建用户
   *
   * @param user 用户基础信息
   *
   * @returns 脱敏用户信息
   */
  create(user: Prisma.UserCreateInput) {
    return from(
      this.prisma.user.create({
        data: {
          ...user,
        },
      })
    ).pipe(desensitize());
  }

  /**
   * 更新用户信息
   *
   * @param id
   * @param user
   * @param where 额外更新条件, 用于权限校验
   *
   * @returns
   */
  update(
    id: User['id'],
    user: Prisma.UserUpdateInput,
    where?: Prisma.UserWhereInput
  ) {
    return from(
      this.prisma.user.update({
        data: {
          ...user,
        },
        where: {
          id,
          AND: [where],
        },
      })
    ).pipe(
      catchError((err) => {
        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === 'P2025'
        )
          throw new NotFoundError();
        throw err;
      }),
      desensitize()
    );
  }

  /**
   * 根据用户 id 获取用户
   *
   * @param id
   *
   * @returns 脱敏用户信息
   */
  findOne(id: User['id']) {
    return from(
      // ! findUniqueOrThrow 方法存在 bug 无法同时进行两个查询 2022/12/2
      this.prisma.user.findUnique({
        where: {
          id,
        },
      })
    ).pipe(
      tap((user) => {
        if (!user) throw new NotFoundError('未找到用户');
      }),
      desensitize()
    );
  }

  /**
   * 根据用户名获取用户信息 (用于账号密码登陆校验)
   *
   * @param username
   *
   * @returns 用户鉴权信息
   */
  findOneByUsername(username: User['username']) {
    return from(
      this.prisma.user.findUnique({
        where: {
          username,
        },
        select: {
          hash: true,
          id: true,
          role: true,
        },
      })
    ).pipe(
      tap((user) => {
        if (!user) throw new NotFoundError('未找到用户');
      })
    );
  }

  /**
   * 获取用户列表
   *
   * @param pagination 分页器
   * @param where ❓查询条件
   * @param orderBy 排序规则
   *
   * @returns 分页( offset )用户数据
   */
  getPaginatedUsers(
    { size, current }: OffsetBasedPaginationInput,
    where?: Prisma.UserWhereInput,
    orderBy: Prisma.UserOrderByWithRelationInput = {
      id: 'desc',
    }
  ) {
    return forkJoin([
      from(
        this.prisma.user.findMany({
          orderBy,
          take: size,
          skip: size * (current - 1),
          where,
        })
      ),
      from(this.prisma.user.count({ where })),
    ]).pipe(
      map(([nodes, totalCount]) => ({
        nodes,
        totalCount,
        current,
        size,
      }))
    );
  }

  /**
   * 为用户生成 InviteCode
   *
   * @param userId
   *
   * @returns
   */
  generateInviteCode(userId: User['id']) {
    return of(Math.random().toString(36).substring(2)).pipe(
      delayWhen((inviteCode) =>
        from(this.redis.hset(RedisKey.InviteCodes, userId + '', inviteCode))
      )
    );
  }
}
