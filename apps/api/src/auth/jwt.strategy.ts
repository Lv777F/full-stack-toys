import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { lastValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
    console.log(config.get('JWT_SECRET'));
  }

  validate({ sub }: { sub: number }) {
    return lastValueFrom(this.userService.getUserById(sub));
  }
}
