import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;
}

@ArgsType()
export class LoginArgs {
  @Field()
  loginInput: LoginInput;
}
