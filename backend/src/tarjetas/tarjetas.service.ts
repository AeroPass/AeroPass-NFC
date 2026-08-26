import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';

import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EstadoTarjeta,
  Tarjeta,
} from './entities/tarjeta.entity';

import { CreateTarjetaDto } from './dto/create-tarjeta.dto';

@Injectable()
export class TarjetasService {
  constructor(
    @InjectRepository(Tarjeta)
    private readonly tarjetaRepository: Repository<Tarjeta>,
  ) {}

  async crear(
    dto: CreateTarjetaDto,
  ): Promise<Tarjeta> {
    const uid = dto.uid.trim().toUpperCase();

    const tarjetaExistente =
      await this.tarjetaRepository.findOne({
        where: {
          uid,
        },
      });

    if (tarjetaExistente) {
      throw new ConflictException(
        'La tarjeta NFC ya está registrada',
      );
    }

    const tarjeta =
      this.tarjetaRepository.create({
        uid,
        estado: EstadoTarjeta.ACTIVA,
        fechaEmision: dto.fechaEmision
          ? new Date(dto.fechaEmision)
          : null,
        observaciones:
          dto.observaciones ?? null,
      });

    return this.tarjetaRepository.save(tarjeta);
  }
}