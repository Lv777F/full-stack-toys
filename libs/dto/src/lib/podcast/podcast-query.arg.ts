import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, ValidateIf } from 'class-validator';
import { SortOrder } from '../common';
import { Tag } from '../tag';
import { User } from '../user';

@InputType({ description: '播客列表查询条件' })
export class PodcastWhereInput {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Field({ nullable: true, description: '根据 title 或 showNote 匹配' })
  keyword?: string;

  @Field(() => [ID], { nullable: true })
  tags: Tag['id'][];

  @Field(() => [ID], { nullable: true })
  authors: User['id'][];

  @Field(() => [Date], { nullable: 'itemsAndList' })
  publishedDate: [Date?, Date?];

  @Field({ nullable: true })
  published: boolean;
}

@InputType()
export class PodcastOrderByInput {
  @Field(() => SortOrder, { nullable: true })
  publishedAt: SortOrder;
}
