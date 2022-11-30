import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { Podcast, Post, Role, Tag, User } from '@prisma/client';

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
      can(Action.Update, 'User', { id: user.id });

      if (user.roles.includes(Role.Contributor)) {
        can([Action.Read, Action.Update], 'Podcast', {
          authors: { some: { authorId: { equals: user.id } } },
        });
      }

      if (user.roles.includes(Role.Admin)) {
        can(Action.Manage, 'all');
      }
    }

    return build();
  }
}
