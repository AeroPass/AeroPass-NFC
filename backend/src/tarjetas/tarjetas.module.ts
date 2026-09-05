import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TarjetasController } from './tarjetas.controller';
import { TarjetasService } from './tarjetas.service';
import { Tarjeta } from './entities/tarjeta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tarjeta,]),
  ],

  controllers: [ TarjetasController,],

  providers: [TarjetasService,],

  exports: [TarjetasService,],
})
export class TarjetasModule {}
