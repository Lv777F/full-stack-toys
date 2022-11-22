import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Podcast } from '../podcast';

@ObjectType()
export class Tag {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Podcast])
  podcasts: Podcast[];
}
