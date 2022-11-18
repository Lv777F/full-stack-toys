import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserId = createParamDecorator(
  (_: undefined, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user.id
);
