import { NotFoundError, ValidationError } from '@full-stack-toys/api-interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { catchError, lastValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  validate(username: string, password: string) {
    return lastValueFrom(
      this.authService.validateUser(username, password).pipe(
        catchError((err) => {
          if (err instanceof NotFoundError || err instanceof ValidationError)
            throw new UnauthorizedException('用户名或密码错误');

          throw err;
        })
      )
    );
  }
}
