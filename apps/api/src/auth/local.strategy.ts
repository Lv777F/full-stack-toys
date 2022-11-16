import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { lastValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      usernameField: 'email',
    });
  }

  validate(email: string, password: string) {
    return lastValueFrom(this.userService.validateUser(email, password));
  }
}
