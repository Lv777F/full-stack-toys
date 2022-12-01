import { OffsetBasedPaginationInput } from '@full-stack-toys/dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { filter, forkJoin, from, map, pipe, throwIfEmpty } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 对用户信息进行脱敏的 rxjs 管道
 */
const desensitize = () =>
  pipe(
    filter(Boolean),
    throwIfEmpty(() => new NotFoundException('未找到用户')),
    map(({ hash: _, ...user }: User) => user)
  );

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
   * 根据用户 id 获取用户
   *
   * @param id
   *
   * @returns 脱敏用户信息
   */
  findOne(id: User['id']) {
    return from(
      this.prisma.user.findUniqueOrThrow({
        where: {
          id,
        },
      })
    ).pipe(desensitize());
  }

  /**
   * 根据邮箱获取指定用户信息 (用于账号密码登陆校验)
   *
   * @param email 📫
   *
   * @returns 用户 id 和 hash
   */
  findOneByEmail(email: User['email']) {
    return from(
      this.prisma.user.findUniqueOrThrow({
        where: {
          email,
        },
        select: {
          hash: true,
          id: true,
          roles: true,
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
    orderBy: Prisma.UserOrderByWithRelationAndSearchRelevanceInput = {
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
