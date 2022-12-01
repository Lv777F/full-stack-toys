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
    can(Action.Read, 'User', ['id', 'name', 'profile', 'status', 'roles']);

    if (user) {
      if (user.roles.includes(Role.Admin)) {
        can(Action.Manage, 'all');
      } else {
        can(Action.Read, 'User', ['email', 'createdAt', 'updatedAt'], {
          id: user.id,
        });
        can(Action.Update, 'User', ['email', 'name', 'profile', 'status'], {
          id: user.id,
        });

        if (user.roles.includes(Role.Contributor)) {
          can(
            [Action.Read, Action.Update],
            'Podcast',
            ['published', 'showNote', 'title'],
            {
              authors: { some: { authorId: { equals: user.id } } },
            }
          );
        }
      }
    }

    return build();
  }
}
