import { Field, InputType } from '@nestjs/graphql';
import {
  IsAlphanumeric,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @IsAlphanumeric()
  @ValidateIf((_, value) => value !== undefined)
  @MinLength(2)
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  profile?: string;
}
