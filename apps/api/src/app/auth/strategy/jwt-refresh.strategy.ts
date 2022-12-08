import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { environment } from '../../../environments/environment';
import { RequestUser } from '../decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(config: ConfigService, private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      ignoreExpiration: !environment.production,
      passReqToCallback: true,
    });
  }

  validate(req: Request, { sub: id }: { sub: RequestUser['id'] }) {
    return this.redisService
      .getClient()
      .sismember(
        'refresh_token_blacklist',
        req.get('Authorization').replace('Bearer ', '')
      )
      .then((isTokenInBlacklist) => {
        if (isTokenInBlacklist) throw new UnauthorizedException('凭据过期');
        return { id };
      });
  }
}
