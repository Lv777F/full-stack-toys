import {
  Field,
  ID,
  MiddlewareContext,
  NextFn,
  ObjectType,
  OmitType,
} from '@nestjs/graphql';
import { CursorBasedPaginated } from '../common';
import { PodcastAuthor } from '../podcast-author';
import { Tag } from '../tag';

@ObjectType()
export class PodcastTag extends OmitType(Tag, ['podcasts']) {}

@ObjectType()
export class Podcast {
  @Field(() => ID)
  id: string;

  @Field()
  title?: string;

  @Field({ nullable: true })
  showNote?: string;

  @Field()
  updatedAt: Date;

  @Field()
  createdAt: Date;

  @Field(() => [PodcastAuthor], { description: '播客主播 & 嘉宾' })
  authors: PodcastAuthor[];

  @Field(() => [PodcastTag], {
    description: '播客相关标签',
    middleware: [
      async (_: MiddlewareContext, next: NextFn) =>
        (await next()).map(({ tag }) => tag),
    ],
  })
  tags: PodcastTag[];
}

@ObjectType()
export class PaginatedPodcasts extends CursorBasedPaginated(Podcast) {}
