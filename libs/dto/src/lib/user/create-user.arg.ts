import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MaxLength, ValidateIf } from 'class-validator';

@InputType()
export class CreateUserInput {
  @IsEmail()
  @ValidateIf((_, value) => value !== undefined)
  @Field({ nullable: true })
  email?: string;

  @IsString()
  @MaxLength(20)
  @Field()
  name: string;

  @Field({ nullable: true })
  profile?: string;
}
