import { Field, InputType } from '@nestjs/graphql';
import {
  IsAlphanumeric,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
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
  @ValidateIf((_, value) => value !== undefined)
  name?: string;

  @Field()
  @MinLength(6)
  @IsString()
  password: string;
}
