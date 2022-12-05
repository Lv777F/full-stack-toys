import {
  Field,
  Int,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { OffsetBasedPaginated } from '../common';
import { PaginatedPodcasts } from '../podcast';

registerEnumType(Role, {
  name: 'Role',
  description: '用户角色',
});

@ObjectType({
  description: '用户',
})
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true, description: '简介' })
  profile?: string;

  @Field({ description: '邮箱 仅自己或管理员可读写' })
  email: string;

  @Field(() => [Role], { description: '角色' })
  roles: Role[];

  @Field()
  createdAt: Date;

  @Field({ nullable: true, description: '当前状态' })
  status?: string;

  @Field(() => PaginatedPodcasts)
  podcasts: PaginatedPodcasts;
}

@ObjectType()
export class PureUser extends OmitType(User, ['podcasts']) {}

@ObjectType()
export class PaginatedUsers extends OffsetBasedPaginated(User) {}
