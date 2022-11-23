import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PodcastIdentity } from '@prisma/client';
import { CursorBasedPaginated } from '../common';
import { Tag } from '../tag';
import { User } from '../user';

@ObjectType()
export class PodcastAuthor {
  @Field(() => String)
  identity: PodcastIdentity;

  @Field(() => User)
  author: User;
}

@ObjectType()
export class PodcastTag {
  @Field(() => Tag)
  tag: Tag;
}

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

  @Field(() => [PodcastAuthor], { nullable: true })
  authors?: PodcastAuthor[];

  @Field(() => [PodcastTag], { nullable: true })
  tags?: PodcastTag[];
}

@ObjectType()
export class PaginatedPodcast extends CursorBasedPaginated(Podcast) {}
