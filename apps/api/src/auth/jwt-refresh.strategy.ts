import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { lastValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(config: ConfigService, private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      ignoreExpiration: !environment.production,
      passReqToCallback: true,
    });
  }

  validate(req: Request, { sub: userId }: { sub: string }) {
    return lastValueFrom(
      this.userService.checkRefreshToken(
        Number(userId),
        req.get('Authorization').replace('Bearer', '').trim()
      )
    );
  }
}
