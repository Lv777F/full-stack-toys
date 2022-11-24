import { Test, TestingModule } from '@nestjs/testing';
import { PodcastsService } from './podcasts.service';

describe('PodcastsService', () => {
  let service: PodcastsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PodcastsService],
    }).compile();

    service = module.get<PodcastsService>(PodcastsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
