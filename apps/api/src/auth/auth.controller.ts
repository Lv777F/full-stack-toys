import { SignupDTO } from '@full-stack-toys/dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { map } from 'rxjs';
import { GetUser } from '../user/get-user.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDTO) {
    return this.authService.signup(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(200)
  login(@GetUser() user: User) {
    return this.authService.signToken(user);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('refresh')
  refresh(@GetUser() user: User) {
    return this.authService.signToken(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logout')
  logout(@GetUser('id') userId: User['id']) {
    return this.authService.logout(userId).pipe(map(() => null));
  }
}
