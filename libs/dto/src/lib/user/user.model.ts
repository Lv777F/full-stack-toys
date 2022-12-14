import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { OffsetBasedPaginated } from '../common';

registerEnumType(Role, {
  name: 'Role',
  description: '用户角色',
});

@ObjectType({
  description: '用户',
})
export class User {
  @Field(() => ID)
  id: string;

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
}

@ObjectType()
export class UserWithInviteCode extends User {
  @Field({ description: '邀请用户的注册凭据,仅 Admin 可读' })
  inviteCode: string;
}

@ObjectType()
export class PaginatedUsers extends OffsetBasedPaginated(User) {}
