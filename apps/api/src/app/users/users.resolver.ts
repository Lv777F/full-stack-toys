import { subject } from '@casl/ability';
import { permittedFieldsOf } from '@casl/ability/extra';
import {
  OffsetBasedPaginationInput,
  PaginatedPodcasts,
  PaginatedUsers,
  User,
  UserOrderByInput,
  UserWhereInput,
} from '@full-stack-toys/dto';
import { Selections } from '@jenyus-org/nestjs-graphql-utils';
import {
  ForbiddenException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Prisma, Role } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { catchError, of, tap } from 'rxjs';
import { AllowAnonymous, CurrentUser, RequestUser } from '../auth/decorator';
import { JwtAuthGuard } from '../auth/guard';
import { Action, CaslAbilityFactory } from '../casl/casl-ability.factory';
import { PodcastsService } from '../podcasts/podcasts.service';
import { UsersService } from './users.service';

const whereMap: Partial<
  Record<
    keyof UserWhereInput,
    (v: UserWhereInput[keyof UserWhereInput]) => Prisma.UserWhereInput
  >
> = {
  email: (v: string) => ({ email: { contains: v } }),
  name: (v: string) => ({ name: { contains: v } }),
  roles: (roles: Role[]) => ({
    roles: { hasEvery: roles },
  }),
};
@UseGuards(JwtAuthGuard)
@Resolver(() => User)
export class UsersResolver {
  constructor(
    private usersService: UsersService,
    private podcastsService: PodcastsService,
    private abilityFactor: CaslAbilityFactory
  ) {}

  @Query(() => User, { description: '当前账号的用户信息' })
  me(@CurrentUser('id') userId: User['id']) {
    return this.usersService.findOne(userId);
  }

  @AllowAnonymous()
  @Query(() => User, { description: '指定 id 的用户信息' })
  user(
    @Args('id', { type: () => Int }) userId: User['id'],
    @Selections('user', ['*.']) readFields: string[],
    @CurrentUser() currentUser?: RequestUser
  ) {
    return this.usersService.findOne(userId).pipe(
      catchError((err) => {
        if (
          err instanceof PrismaClientKnownRequestError &&
          err.code === 'P2025'
        ) {
          throw new NotFoundException('未找到指定用户');
        }
        throw err;
      }),
      tap((user) => {
        const permittedFields = permittedFieldsOf(
          this.abilityFactor.createAbility(currentUser),
          Action.Read,
          subject('User', { ...user, hash: '' }),
          {
            fieldsFrom: ({ fields }) => fields,
          }
        );
        const accessDefinedFields = readFields.filter(
          (field) => !permittedFields.includes(field)
        );
        if (accessDefinedFields.length)
          throw new ForbiddenException(
            `无权获取用户信息: ${accessDefinedFields.join(', ')}`
          );
      })
    );
  }

  @ResolveField(() => PaginatedPodcasts, { description: '用户相关播客' })
  podcasts(
    @Parent() { id: userId, roles }: User,
    @Args('limit', { type: () => Int, defaultValue: 5, nullable: true })
    limit: number,
    @Selections('podcasts.nodes', ['**']) relations: string[]
  ) {
    if (!roles.length)
      return of({
        nodes: [],
        totalCount: 0,
        hasNextPage: false,
      });
    return this.podcastsService.getPaginatedPodcasts({ limit }, relations, {
      published: true,
      authors: {
        some: {
          authorId: userId,
        },
      },
    });
  }

  @AllowAnonymous()
  @Query(() => PaginatedUsers, { description: '分页查询用户' })
  users(
    @Args('pagination') pagination: OffsetBasedPaginationInput,
    @Selections('users.nodes', ['*.']) readFields: string[],
    @Args('filters', { nullable: true }) whereInput?: UserWhereInput,
    @Args('sorts', { nullable: true }) orderBy?: UserOrderByInput,
    @CurrentUser() currentUser?: RequestUser
  ) {
    const permittedFields = permittedFieldsOf(
      this.abilityFactor.createAbility(currentUser),
      Action.Read,
      'User',
      {
        fieldsFrom: ({ fields }) => fields,
      }
    );
    const assessDefinedFields = readFields.filter(
      (field) => !permittedFields.includes(field)
    );
    if (assessDefinedFields.length)
      throw new ForbiddenException(
        `无权获取用户列表字段: ${assessDefinedFields.join(', ')}`
      );

    return this.usersService.getPaginatedUsers(
      pagination,
      {
        AND: Object.entries(whereInput ?? {}).map(
          ([key, value]) => whereMap[key]?.(value) ?? { [key]: value }
        ),
      },
      orderBy
    );
  }
}
