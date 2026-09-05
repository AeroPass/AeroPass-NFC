// src/tarjetas/tarjetas.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TarjetasService } from './tarjetas.service';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';

@Controller('tarjetas')
export class TarjetasController {
  constructor(private readonly tarjetasService: TarjetasService) {}

  @Post()
  async crear(@Body() dto: CreateTarjetaDto) {
    return this.tarjetasService.crear(dto);
  }

  @Get('uid/:uid')
  async consultarPorUid(@Param('uid') uid: string) {
    return this.tarjetasService.consultarPorUid(uid);
  }

  // Puedes mantener los demás métodos si los necesitas
}