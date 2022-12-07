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

  @Field({ description: '用户名 仅自己或 Admin 可读' })
  username: string;

  @Field()
  name: string;

  @Field({ nullable: true, description: '简介' })
  profile?: string;

  @Field(() => Role, { description: '角色' })
  role: Role;

  @Field()
  createdAt: Date;

  @Field({ nullable: true, description: '当前状态' })
  status?: string;

  @Field(() => PaginatedPodcasts)
  podcasts: PaginatedPodcasts;
}

@ObjectType({ description: '无关联关系的用户信息' })
export class PureUser extends OmitType(User, ['podcasts']) {}

@ObjectType()
export class PaginatedUsers extends OffsetBasedPaginated(User) {}
