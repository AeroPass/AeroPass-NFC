import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarTarjetaDto } from './dto/actualizar-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from './dto/cambiar-estado-tarjeta.dto';
import { CrearTarjetaDto } from './dto/crear-tarjeta.dto';
import { EstadoTarjeta, Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class TarjetasService {
  constructor(@InjectRepository(Tarjeta) private readonly repo: Repository<Tarjeta>) {}

  async crear(dto: CrearTarjetaDto) {
    const uid = dto.uid.toUpperCase();
    const existing = await this.repo.findOne({ where: { uid } });
    if (existing) throw new ConflictException('Ya existe una tarjeta con ese UID.');

    try {
      const tarjeta = this.repo.create({
        uid,
        fechaEmision: dto.fechaEmision ?? null,
        observaciones: dto.observaciones ?? null,
        estado: EstadoTarjeta.ACTIVA,
      });
      return this.repo.save(tarjeta);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') throw new ConflictException('Ya existe una tarjeta con ese UID.');
      throw error;
    }
  }

  obtenerTodas() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async obtenerPorUid(uid: string) {
    const tarjeta = await this.repo.findOne({ where: { uid: uid.toUpperCase() } });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada.');
    return tarjeta;
  }

  async obtenerPorId(id: string) {
    const tarjeta = await this.repo.findOne({ where: { id: Number(id) } });
    if (!tarjeta) throw new NotFoundException('Tarjeta no encontrada.');
    return tarjeta;
  }

  async actualizar(id: string, dto: ActualizarTarjetaDto) {
    const tarjeta = await this.obtenerPorId(id);
    if (dto.fechaEmision !== undefined) tarjeta.fechaEmision = dto.fechaEmision;
    if (dto.observaciones !== undefined) tarjeta.observaciones = dto.observaciones;
    return this.repo.save(tarjeta);
  }

  async cambiarEstado(id: string, dto: CambiarEstadoTarjetaDto) {
    const tarjeta = await this.obtenerPorId(id);
    tarjeta.estado = dto.estado;
    return this.repo.save(tarjeta);
  }

  desactivar(id: string) {
    return this.cambiarEstado(id, { estado: EstadoTarjeta.INACTIVA });
  }

  reactivar(id: string) {
    return this.cambiarEstado(id, { estado: EstadoTarjeta.ACTIVA });
  }

  bloquear(id: string) {
    return this.cambiarEstado(id, { estado: EstadoTarjeta.BLOQUEADA });
  }

  async eliminar(id: string) {
    const tarjeta = await this.obtenerPorId(id);
    await this.repo.remove(tarjeta);
    return { ok: true, message: 'Tarjeta eliminada.' };
  }
}
