import { RedisKey } from '@full-stack-toys/api-interface';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { environment } from '../../../environments/environment';
import { RequestUser } from '../decorator';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh'
) {
  constructor(config: ConfigService, @InjectRedis() private redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      ignoreExpiration: !environment.production,
      passReqToCallback: true,
    });
  }

  validate(req: Request, { sub: id }: { sub: RequestUser['id'] }) {
    return this.redis
      .sismember(
        RedisKey.RefreshTokenBlacklist.replace('{id}', id + ''),
        req.get('Authorization').replace('Bearer ', '')
      )
      .then((isTokenInBlacklist) => {
        if (isTokenInBlacklist) throw new UnauthorizedException('凭据过期');
        return { id };
      });
  }
}
