import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { PodcastIdentity } from '@prisma/client';
import { Author } from './author.model';
@ObjectType()
export class PodcastAuthor {
  @Field(() => String)
  identity: PodcastIdentity;

  @Field(() => Author, { name: 'info' })
  author: Type<Author>;

  @Field({ nullable: true, description: '主播形容词' })
  adjective?: string;
}
