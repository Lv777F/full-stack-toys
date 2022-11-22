import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType({ description: '注册所需信息' })
export class SignUpInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  @IsString()
  password: string;

  @Field()
  @IsString()
  @MaxLength(20)
  name: string;
}

@ArgsType()
export class SignUpArgs {
  @Field()
  signUpInput: SignUpInput;
}
