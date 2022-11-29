import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '@prisma/client';

export type RequestUser = Pick<User, 'id' | 'roles'>;

/**
 * 根据身份凭据获取 userId 和 roles?
 */
export const CurrentUser = createParamDecorator(
  (key: keyof RequestUser | undefined, context: ExecutionContext) => {
    const { user } = GqlExecutionContext.create(context).getContext().req;
    return key ? user[key] : user;
  }
);
