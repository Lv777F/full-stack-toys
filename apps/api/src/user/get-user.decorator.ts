import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 根据身份凭据获取 userId
 */
export const CurrentUserId = createParamDecorator(
  (_: undefined, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user.id
);
