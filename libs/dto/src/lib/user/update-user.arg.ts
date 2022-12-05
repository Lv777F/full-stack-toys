import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { MaxLength } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @MaxLength(20)
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  profile?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => [Role], { nullable: 'itemsAndList' })
  roles?: Role[];
}
