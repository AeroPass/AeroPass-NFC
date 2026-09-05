import { UpdateTarjetaDto } from './dto/update-tarjeta.dto';
// src/tarjetas/tarjetas.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTarjetaDto } from './dto/create-tarjeta.dto';
import { EstadoTarjeta, Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class TarjetasService {
  constructor(
    @InjectRepository(Tarjeta)
    private readonly tarjetaRepository: Repository<Tarjeta>,
  ) {}

  async crear(dto: CreateTarjetaDto): Promise<Tarjeta> {
    const uid = dto.uid.trim().toUpperCase();

    const tarjetaExistente = await this.tarjetaRepository.findOne({ where: { uid } });
    if (tarjetaExistente) {
      throw new ConflictException('La tarjeta NFC ya está registrada');
    }

    const tarjeta = this.tarjetaRepository.create({
      uid,
      estado: EstadoTarjeta.ACTIVA,
      fechaEmision: dto.fechaEmision ? new Date(dto.fechaEmision) : null,
      observaciones: dto.observaciones ?? null,
      dispositivoId: dto.dispositivoId ?? null,
    });

    return this.tarjetaRepository.save(tarjeta);
  }

  async consultarPorUid(uid: string): Promise<Tarjeta> {
    const tarjeta = await this.tarjetaRepository.findOne({ where: { uid } });
    if (!tarjeta) {
      throw new NotFoundException('Tarjeta no encontrada');
    }
    return tarjeta;
  }
}