import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { from, lastValueFrom, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate({ sub }: { sub: number }) {
    return lastValueFrom(
      from(
        this.prisma.user.findUnique({
          where: {
            id: sub,
          },
        })
      ).pipe(map((user) => user && (delete user.hash, user)))
    );
  }
}
