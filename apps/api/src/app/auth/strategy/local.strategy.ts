import { ValidationError } from '@full-stack-toys/api-interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { Strategy } from 'passport-local';
import { catchError, lastValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  validate(email: string, password: string) {
    return lastValueFrom(
      this.authService.validateUser(email, password).pipe(
        catchError((err) => {
          if (
            (err instanceof PrismaClientKnownRequestError &&
              err.code === 'P2025') ||
            err instanceof ValidationError
          ) {
            throw new UnauthorizedException('用户名或密码错误');
          }
          throw err;
        })
      )
    );
  }
}
