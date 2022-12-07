import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @MaxLength(20)
  @IsString()
  @MinLength(2)
  @ValidateIf((_, value) => value !== undefined)
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  profile?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => [Role], {
    nullable: 'itemsAndList',
    description: '修改该字段需要 Admin 权限',
  })
  roles?: Role[];
}
