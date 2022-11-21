import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: 'Jwt 用户凭据',
})
export class Credentials {
  @Field({ description: '有效时间 15m' })
  accessToken: string;

  @Field({ description: '用于刷新 AccessToken 有效时间 7d' })
  refreshToken: string;
}
