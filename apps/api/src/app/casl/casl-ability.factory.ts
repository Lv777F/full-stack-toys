import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { Podcast, Post, Tag, User } from '@prisma/client';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type AppAbility = PureAbility<
  [
    Action,
    Subjects<{ User: User; Podcast: Podcast; Post: Post; Tag: Tag }> | 'all'
  ],
  PrismaQuery
>;
@Injectable()
export class CaslAbilityFactory {
  createAbility(user?: Pick<User, 'id' | 'roles'>) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createPrismaAbility
    );

    can(Action.Read, 'Podcast', { published: true });
    can(Action.Read, 'Post', { published: true });
    can(Action.Read, 'User');

    if (user) {
      // TODO 添加 roles 到 jwt
      can(Action.Update, 'User', { id: user.id });

      can([Action.Read, Action.Update], 'Podcast', {
        authors: { some: { authorId: { equals: user.id } } },
      });
    }

    return build();
  }
}
