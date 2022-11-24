import { ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../user';

@ObjectType()
export class Author extends PickType(User, [
  'name',
  'id',
  'profile',
  'status',
] as const) {}
