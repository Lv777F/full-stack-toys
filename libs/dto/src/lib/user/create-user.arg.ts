import { Field, InputType } from '@nestjs/graphql';
import { IsAlphanumeric } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsString()
  name: string;

  @IsAlphanumeric()
  @ValidateIf((_, value) => value !== undefined)
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  profile?: string;
}
