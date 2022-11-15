import { Test, TestingModule } from '@nestjs/testing';
import { PodcastController } from './podcast.controller';

describe('PodcastController', () => {
  let controller: PodcastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PodcastController],
    }).compile();

    controller = module.get<PodcastController>(PodcastController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
