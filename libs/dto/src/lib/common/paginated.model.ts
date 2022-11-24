import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export interface CursorBasedPaginatedType<T> {
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export function CursorBasedPaginated<T>(
  classRef: Type<T>
): Type<CursorBasedPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements CursorBasedPaginatedType<T> {
    @Field(() => [classRef])
    nodes: T[];

    @Field(() => Int, { description: '总条数' })
    totalCount: number;

    @Field({ description: '是否有下一页' })
    hasNextPage: boolean;
  }
  return PaginatedType as Type<CursorBasedPaginatedType<T>>;
}

export interface OffsetBasedPaginatedType<T> {
  nodes: T[];
  totalCount: number;
  current: number;
  size: number;
}

export function OffsetBasedPaginated<T>(
  classRef: Type<T>
): Type<OffsetBasedPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements OffsetBasedPaginatedType<T> {
    @Field(() => [classRef])
    nodes: T[];

    @Field(() => Int, { description: '总条数' })
    totalCount: number;

    @Field(() => Int, { description: '当前页码' })
    current: number;

    @Field(() => Int, { description: '每页条数' })
    size: number;
  }
  return PaginatedType as Type<OffsetBasedPaginatedType<T>>;
}
