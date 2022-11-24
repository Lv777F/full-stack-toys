import { Module } from '@nestjs/common';
import { PodcastsModule } from '../podcasts/podcasts.module';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  imports: [PodcastsModule],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
