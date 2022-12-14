import { Field, InputType } from '@nestjs/graphql';
import { IsAlphanumeric, IsString, MinLength } from 'class-validator';

@InputType({ description: '登录所需信息' })
export class LoginInput {
  @Field()
  @IsAlphanumeric()
  @MinLength(2)
  username: string;

  @Field()
  @MinLength(6)
  @IsString()
  password: string;
}
