import { Test, TestingModule } from '@nestjs/testing';
import { PodcastsResolver } from './podcasts.resolver';

describe('PodcastsResolver', () => {
  let resolver: PodcastsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PodcastsResolver],
    }).compile();

    resolver = module.get<PodcastsResolver>(PodcastsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
