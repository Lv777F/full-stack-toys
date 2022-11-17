import { SignupDTO } from '@full-stack-toys/dto';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { map } from 'rxjs';
import { CurrentUser } from '../user/get-user.decorator';
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
  login(@CurrentUser('id') userId: User['id']) {
    return this.authService.login(userId);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('refresh')
  refresh(
    @CurrentUser('id') userId: User['id'],
    @Headers('Authorization') authorization: string
  ) {
    return this.authService.refresh(
      userId,
      authorization.replace('Bearer ', '')
    );
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Get('logout')
  logout(
    @CurrentUser('id') userId: User['id'],
    @Headers('Authorization') authorization: string
  ) {
    return this.authService
      .deleteToken(userId, authorization.replace('Bearer ', ''))
      .pipe(map(() => null));
  }
}
