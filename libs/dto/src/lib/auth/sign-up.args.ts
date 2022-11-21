import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignUpInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;

  @Field()
  @MaxLength(20)
  name: string;
}

@ArgsType()
export class SignUpArgs {
  @Field()
  signUpInput: SignUpInput;
}
