import { Test, TestingModule } from '@nestjs/testing';
import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';

describe('TarjetasController', () => {
  let controller: TarjetasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarjetasController],
      providers: [TarjetasService],
    }).compile();

    controller = module.get<TarjetasController>(TarjetasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
