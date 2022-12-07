import { Field, InputType } from '@nestjs/graphql';
import {
  IsAlphanumeric,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType({ description: '注册所需信息' })
export class SignUpInput {
  @Field()
  @IsAlphanumeric()
  @MinLength(2)
  username: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name: string;

  @Field()
  @MinLength(6)
  @IsString()
  password: string;
}
