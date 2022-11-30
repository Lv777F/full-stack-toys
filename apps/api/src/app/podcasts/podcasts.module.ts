import { Module } from '@nestjs/common';
import { CaslModule } from '../casl/casl.module';
import { PodcastsResolver } from './podcasts.resolver';
import { PodcastsService } from './podcasts.service';

@Module({
  imports: [CaslModule],
  providers: [PodcastsService, PodcastsResolver],
  exports: [PodcastsService],
})
export class PodcastsModule {}
