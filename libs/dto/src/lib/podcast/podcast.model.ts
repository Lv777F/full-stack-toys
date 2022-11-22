import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Paginated } from '../common';
import { Tag } from '../tag';
import { User } from '../user';

@ObjectType()
export class Podcast {
  @Field(() => Int)
  id: number;

  @Field()
  title?: string;

  @Field({ nullable: true })
  showNote?: string;

  @Field()
  updatedAt: Date;

  @Field()
  createdAt: Date;

  @Field(() => [User])
  authors: User[];

  @Field(() => [Tag])
  tags: Tag[];
}

@ObjectType()
export class PaginatedPodcast extends Paginated(Podcast) {}
