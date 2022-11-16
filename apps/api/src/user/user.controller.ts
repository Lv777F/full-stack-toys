import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from './get-user.decorator';

@Controller('users')
export class UserController {
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }
}
