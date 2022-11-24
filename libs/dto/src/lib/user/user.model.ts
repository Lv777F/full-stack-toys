import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PaginatedPodcast } from '../podcast';

@ObjectType({
  description: '用户',
})
export class User {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true, description: '简介' })
  profile?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true, description: '当前状态' })
  status?: string;

  @Field(() => PaginatedPodcast)
  podcasts: PaginatedPodcast;
}
