import { Module } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import { PodcastsResolver } from './podcasts.resolver';

@Module({
  providers: [PodcastsService, PodcastsResolver],
  exports: [PodcastsService],
})
export class PodcastsModule {}
