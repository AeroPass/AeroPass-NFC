import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarTarjetaDto } from './dto/actualizar-tarjeta.dto';
import { CambiarEstadoTarjetaDto } from './dto/cambiar-estado-tarjeta.dto';
import { CrearTarjetaDto } from './dto/crear-tarjeta.dto';
import { EstadoTarjeta, Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class TarjetasService {
  constructor(
    @InjectRepository(Tarjeta)
    private readonly repositorioTarjetas: Repository<Tarjeta>,
  ) {}

  async crear(dto: CrearTarjetaDto): Promise<Tarjeta> {
    const uidNormalizado = this.normalizarUid(dto.uid);

    const tarjetaExistente = await this.repositorioTarjetas.findOne({
      where: { uid: uidNormalizado },
    });

    if (tarjetaExistente) {
      throw new ConflictException(
        'La tarjeta NFC ya está registrada con ese UID',
      );
    }

    const tarjeta = this.repositorioTarjetas.create({
      uid: uidNormalizado,
      estado: EstadoTarjeta.ACTIVA,
      fechaEmision: dto.fechaEmision
        ? new Date(dto.fechaEmision)
        : null,
      observaciones: dto.observaciones?.trim() || null,
    });

    try {
      return await this.repositorioTarjetas.save(tarjeta);
    } catch (error) {
      if (this.esErrorDeRestriccionUnica(error)) {
        throw new ConflictException(
          'La tarjeta NFC ya está registrada con ese UID',
        );
      }

      throw error;
    }
  }

  async obtenerTodas(): Promise<Tarjeta[]> {
    return this.repositorioTarjetas.find({
      order: {
        id: 'DESC',
      },
    });
  }

  async obtenerPorId(id: string): Promise<Tarjeta> {
    const tarjeta = await this.repositorioTarjetas.findOne({
      where: { id },
    });

    if (!tarjeta) {
      throw new NotFoundException('Tarjeta NFC no encontrada');
    }

    return tarjeta;
  }

  async obtenerPorUid(uid: string): Promise<Tarjeta> {
    const uidNormalizado = this.normalizarUid(uid);

    const tarjeta = await this.repositorioTarjetas.findOne({
      where: { uid: uidNormalizado },
    });

    if (!tarjeta) {
      throw new NotFoundException('Tarjeta NFC no encontrada');
    }

    return tarjeta;
  }

  async actualizar(
    id: string,
    dto: ActualizarTarjetaDto,
  ): Promise<Tarjeta> {
    const tarjeta = await this.obtenerPorId(id);

    if (dto.fechaEmision !== undefined) {
      tarjeta.fechaEmision = new Date(dto.fechaEmision);
    }

    if (dto.observaciones !== undefined) {
      tarjeta.observaciones = dto.observaciones.trim() || null;
    }

    return this.repositorioTarjetas.save(tarjeta);
  }

  async cambiarEstado(
    id: string,
    dto: CambiarEstadoTarjetaDto,
  ): Promise<Tarjeta> {
    const tarjeta = await this.obtenerPorId(id);

    tarjeta.estado = dto.estado;

    return this.repositorioTarjetas.save(tarjeta);
  }

  async desactivar(id: string): Promise<Tarjeta> {
    return this.cambiarEstado(id, {
      estado: EstadoTarjeta.INACTIVA,
    });
  }

  async reactivar(id: string): Promise<Tarjeta> {
    return this.cambiarEstado(id, {
      estado: EstadoTarjeta.ACTIVA,
    });
  }

  async bloquear(id: string): Promise<Tarjeta> {
    return this.cambiarEstado(id, {
      estado: EstadoTarjeta.BLOQUEADA,
    });
  }

  async eliminar(id: string): Promise<void> {
    const tarjeta = await this.obtenerPorId(id);

    await this.repositorioTarjetas.remove(tarjeta);
  }

  private normalizarUid(uid: string): string {
    return uid.trim().toUpperCase();
  }

  private esErrorDeRestriccionUnica(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const errorMysql = error as { code?: string };
    return errorMysql.code === 'ER_DUP_ENTRY';
  }
}

