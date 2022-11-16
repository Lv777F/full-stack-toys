import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 根据 JWT 获取用户信息
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user[data] : request.user;
  }
);
