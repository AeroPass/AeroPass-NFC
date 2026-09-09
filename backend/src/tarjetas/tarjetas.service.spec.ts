import { Test, TestingModule } from '@nestjs/testing';
import { TarjetasService } from './tarjetas.service';

describe('TarjetasService', () => {
  let service: TarjetasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TarjetasService],
    }).compile();

    service = module.get<TarjetasService>(TarjetasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
