import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * 根据身份凭据获取 userId
 */
export const CurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext) =>
    GqlExecutionContext.create(context).getContext().req.user.id
);
