import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GestionAcademicaModule } from './gestion-academica/gestion-academica.module';

@Module({
  imports: [GestionAcademicaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
