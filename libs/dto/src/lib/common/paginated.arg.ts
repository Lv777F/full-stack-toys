import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CursorBasedPaginationInput {
  @Field({ description: '每页条数' })
  limit: number;

  @Field({ nullable: true, description: '游标' })
  cursor?: string;
}

@InputType()
export class OffsetBasedPaginationInput {
  @Field({ description: '每页条数' })
  size: number;

  @Field({ nullable: true, description: '页码', defaultValue: 1 })
  current?: number;
}
