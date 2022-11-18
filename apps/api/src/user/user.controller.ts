import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { CurrentUserId } from './get-user.decorator';
import { UserService } from './user.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  getMe(@CurrentUserId() userId: User['id']) {
    return this.userService.getUserById(userId);
  }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) userId: User['id']) {
    return this.userService.getUserById(userId);
  }
}
