import { Module } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';

@Module({
  providers: [PodcastsService],
  exports: [PodcastsService],
})
export class PodcastsModule {}
