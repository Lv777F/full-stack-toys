import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { catchError, from, of, throwError } from 'rxjs';
import { ALLOW_ANONYMOUS_KEY } from '../decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(context: ExecutionContext) {
    return from(super.canActivate(context) as Promise<boolean>).pipe(
      catchError((err) => {
        if (err instanceof UnauthorizedException) {
          const ctx = GqlExecutionContext.create(context);

          if (
            this.reflector.getAllAndOverride<boolean | undefined>(
              ALLOW_ANONYMOUS_KEY,
              [ctx.getHandler(), ctx.getClass()]
            )
          )
            return of(true);
        }

        return throwError(() => err);
      })
    );
  }
}
