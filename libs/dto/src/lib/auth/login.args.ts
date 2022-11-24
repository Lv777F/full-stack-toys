import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType({ description: '登录所需信息' })
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  @IsString()
  password: string;
}
