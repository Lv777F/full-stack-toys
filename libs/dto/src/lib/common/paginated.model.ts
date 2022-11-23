import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

interface CursorBasedEdgeType<T> {
  cursor: string;
  node: T;
}

export interface CursorBasedPaginatedType<T> {
  edges: CursorBasedEdgeType<T>[];
  nodes: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export function CursorBasedPaginated<T>(
  classRef: Type<T>
): Type<CursorBasedPaginatedType<T>> {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field(() => String)
    cursor: string;

    @Field(() => classRef)
    node: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements CursorBasedPaginatedType<T> {
    @Field(() => [EdgeType], { description: '带游标的项' })
    edges: EdgeType[];

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
