import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { Max } from 'class-validator';

@InputType()
export class CursorBasedPaginationInput {
  @Max(50)
  @Field(() => Int, { description: '每页条数' })
  limit: number;

  @Field({ nullable: true, description: '游标' })
  cursor?: string;
}

@InputType()
export class OffsetBasedPaginationInput {
  @Max(50)
  @Field(() => Int, { description: '每页条数' })
  size: number;

  @Field(() => Int, { nullable: true, description: '页码', defaultValue: 1 })
  current?: number;
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: '排序方式',
  valuesMap: {
    asc: {
      description: '递增',
    },
    desc: {
      description: '递减',
    },
  },
});
