import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Persona } from '../usuarios/entities/persona.entity';
import { AsignarTarjetaDto } from './dto/asignar-tarjeta.dto';
import { DesvincularTarjetaDto } from './dto/desvincular-tarjeta.dto';
import { AsignacionTarjeta } from './entities/asignacion-tarjeta.entity';
import { EstadoTarjeta, Tarjeta } from './entities/tarjeta.entity';

@Injectable()
export class AsignacionTarjetasService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AsignacionTarjeta)
    private readonly asignaciones: Repository<AsignacionTarjeta>,
    @InjectRepository(Tarjeta)
    private readonly tarjetas: Repository<Tarjeta>,
    @InjectRepository(Estudiante)
    private readonly estudiantes: Repository<Estudiante>,
    @InjectRepository(Persona)
    private readonly personas: Repository<Persona>,
  ) {}

  /**
   * Serializa asignaciones de la misma tarjeta o estudiante bloqueando ambas
   * filas maestras en una transacción. La unicidad lógica se valida además de
   * los índices disponibles en el esquema legado.
   */
  async asignar(dto: AsignarTarjetaDto) {
    const ahora = new Date();

    const asignacion = await this.dataSource.transaction(async (manager) => {
      const tarjetaRepo = manager.getRepository(Tarjeta);
      const estudianteRepo = manager.getRepository(Estudiante);
      const personaRepo = manager.getRepository(Persona);
      const asignacionRepo = manager.getRepository(AsignacionTarjeta);

      const tarjeta = await tarjetaRepo.findOne({
        where: { id: dto.tarjetaId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!tarjeta) throw new NotFoundException('Tarjeta NFC no encontrada.');
      if (tarjeta.estado !== EstadoTarjeta.ACTIVA) {
        throw new ConflictException('Solo se pueden asignar tarjetas activas.');
      }

      const estudiante = await estudianteRepo.findOne({
        where: { id: dto.estudianteId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!estudiante) throw new NotFoundException('Estudiante no encontrado.');
      if (estudiante.estado !== 'ACTIVO') {
        throw new ConflictException('El estudiante no se encuentra activo.');
      }

      const persona = await personaRepo.findOne({ where: { id: estudiante.personaId } });
      if (!persona || persona.estado !== 'ACTIVA') {
        throw new ConflictException('La persona asociada al estudiante no está activa.');
      }

      const asignacionTarjetaActiva = await asignacionRepo.findOne({
        where: {
          tarjetaId: tarjeta.id,
          fechaFin: IsNull(),
          fechaInicio: LessThanOrEqual(ahora),
        },
      });
      if (asignacionTarjetaActiva) {
        throw new ConflictException('La tarjeta ya está asignada a una persona.');
      }

      const asignacionEstudianteActiva = await asignacionRepo.findOne({
        where: {
          personaId: persona.id,
          fechaFin: IsNull(),
          fechaInicio: LessThanOrEqual(ahora),
        },
      });
      if (asignacionEstudianteActiva) {
        throw new ConflictException('El estudiante ya tiene una tarjeta asignada. Desvincule la anterior primero.');
      }

      const nueva = asignacionRepo.create({
        tarjetaId: tarjeta.id,
        personaId: persona.id,
        fechaInicio: ahora,
        fechaFin: null,
        motivo: dto.motivo?.trim() || null,
      });
      return asignacionRepo.save(nueva);
    });

    return {
      mensaje: 'Tarjeta asignada correctamente.',
      asignacion: {
        id: asignacion.id,
        estudianteId: dto.estudianteId,
        tarjetaId: asignacion.tarjetaId,
        fechaInicio: asignacion.fechaInicio,
        fechaFin: asignacion.fechaFin,
        motivo: asignacion.motivo,
      },
    };
  }

  async desvincular(id: number, dto: DesvincularTarjetaDto = {}) {
    const ahora = new Date();
    const asignacion = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(AsignacionTarjeta);
      const actual = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!actual) throw new NotFoundException('Asignación de tarjeta no encontrada.');
      if (actual.fechaFin) throw new ConflictException('La asignación ya está desvinculada.');

      actual.fechaFin = ahora;
      if (dto.motivo?.trim()) {
        const motivoPrevio = actual.motivo?.trim();
        const detalle = `Desvinculación: ${dto.motivo.trim()}`;
        actual.motivo = [motivoPrevio, detalle].filter(Boolean).join(' | ').slice(0, 255);
      }
      return repo.save(actual);
    });

    return {
      mensaje: 'Tarjeta desvinculada correctamente.',
      asignacion: {
        id: asignacion.id,
        tarjetaId: asignacion.tarjetaId,
        personaId: asignacion.personaId,
        fechaInicio: asignacion.fechaInicio,
        fechaFin: asignacion.fechaFin,
        motivo: asignacion.motivo,
      },
    };
  }

  async estadoEstudiante(estudianteId: number) {
    const estudiante = await this.estudiantes.findOne({ where: { id: estudianteId } });
    if (!estudiante) throw new NotFoundException('Estudiante no encontrado.');

    const persona = await this.personas.findOne({ where: { id: estudiante.personaId } });
    if (!persona) throw new NotFoundException('Persona asociada al estudiante no encontrada.');

    const ahora = new Date();
    const asignacion = await this.asignaciones.findOne({
      where: {
        personaId: persona.id,
        fechaFin: IsNull(),
        fechaInicio: LessThanOrEqual(ahora),
      },
      order: { fechaInicio: 'DESC' },
    });

    if (!asignacion) {
      return {
        estudianteId: estudiante.id,
        codigoEstudiante: estudiante.codigoEstudiante,
        tieneTarjetaActiva: false,
        tarjeta: null,
        asignacion: null,
      };
    }

    const tarjeta = await this.tarjetas.findOne({ where: { id: asignacion.tarjetaId } });
    return {
      estudianteId: estudiante.id,
      codigoEstudiante: estudiante.codigoEstudiante,
      tieneTarjetaActiva: Boolean(tarjeta && tarjeta.estado === EstadoTarjeta.ACTIVA),
      tarjeta: tarjeta ? {
        id: tarjeta.id,
        identificadorTarjeta: tarjeta.uid,
        estado: tarjeta.estado,
        fechaEmision: tarjeta.fechaEmision,
      } : null,
      asignacion: {
        id: asignacion.id,
        fechaInicio: asignacion.fechaInicio,
        fechaFin: asignacion.fechaFin,
      },
    };
  }
}
