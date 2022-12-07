import { OffsetBasedPaginationInput } from '@full-stack-toys/dto';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { forkJoin, from, map, pipe } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 对用户信息进行脱敏的 rxjs 管道
 */
const desensitize = () => pipe(map(({ hash: _, ...user }: User) => user));

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    ).pipe(desensitize());
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
      // !该方法存在 bug 无法同时进行两个查询 2022/12/2
      this.prisma.user.findUniqueOrThrow({
        where: {
          id,
        },
      })
    ).pipe(desensitize());
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
      this.prisma.user.findUniqueOrThrow({
        where: {
          username,
        },
        select: {
          hash: true,
          id: true,
          role: true,
        },
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
}
