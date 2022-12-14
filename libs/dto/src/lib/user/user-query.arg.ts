import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { SortOrder } from '../common';

@InputType({ description: '用户列表查询条件' })
export class UserWhereInput {
  @Field(() => [Role], { nullable: true })
  roles: Role[];

  @Field({ nullable: true })
  name: string;
}

@InputType()
export class UserOrderByInput {
  @Field(() => SortOrder)
  createdAt: SortOrder;
}
