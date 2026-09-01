import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Estudiante } from '../entities/estudiante.entity.js';
import { Docente } from '../entities/docente.entity.js';
import { AsignacionDocente } from '../entities/asignacion-docente.entity.js';
import { MatriculaGrupo } from '../entities/matricula-grupo.entity.js';

@Injectable()
export class EstudiantesService {
  constructor(
    @InjectRepository(Estudiante) private estudianteRepo: Repository<Estudiante>,
    @InjectRepository(Docente) private docenteRepo: Repository<Docente>,
    @InjectRepository(AsignacionDocente) private asignacionRepo: Repository<AsignacionDocente>,
    @InjectRepository(MatriculaGrupo) private matriculaRepo: Repository<MatriculaGrupo>,
  ) {}

  /**
   * GET /estudiantes
   *
   * - ADMIN: ve TODOS los estudiantes del sistema
   * - DOCENTE: ve ÚNICAMENTE los estudiantes de SUS grupos
   */
  async findAll(user: any) {
    if (user.rol.codigo === 'ADMIN') {
      return this.findAllForAdmin();
    }
    if (user.rol.codigo === 'DOCENTE') {
      return this.findAllForDocente(user);
    }
    throw new ForbiddenException('Su rol no tiene permiso para ver listas de estudiantes.');
  }

  private async findAllForAdmin() {
    const estudiantes = await this.estudianteRepo.find({
      relations: ['persona', 'matriculas', 'matriculas.grupo'],
      order: { persona: { apellidos: 'ASC' } as any },
    });

    const result = estudiantes.map((e) => ({
      id: Number(e.id),
      codigoEstudiante: e.codigoEstudiante,
      estado: e.estado,
      fechaIngreso: e.fechaIngreso,
      persona: {
        id: Number(e.persona.id),
        nombres: e.persona.nombres,
        apellidos: e.persona.apellidos,
        nombreCompleto: `${e.persona.nombres} ${e.persona.apellidos}`,
        email: e.persona.email,
        documento: e.persona.documento,
        estado: e.persona.estado,
      },
      grupos: (e.matriculas || [])
        .filter((m) => m.estado === 'ACTIVA')
        .map((m) => ({
          id: Number(m.grupo.id),
          codigo: m.grupo.codigo,
          nombre: m.grupo.nombre,
        })),
    }));

    return {
      estudiantes: result,
      total: result.length,
      vista: 'ADMIN - Todos los estudiantes del sistema',
    };
  }

  private async findAllForDocente(user: any) {
    const docente = await this.docenteRepo.findOne({
      where: { personaId: BigInt(user.persona.id) as any },
    });

    if (!docente) {
      return {
        estudiantes: [],
        total: 0,
        vista: 'DOCENTE - No tienes registro de docente',
        mensaje: 'Tu persona no está registrada como docente en el sistema.',
      };
    }

    const asignaciones = await this.asignacionRepo.find({
      where: { docenteId: docente.id, estado: 'ACTIVA' },
      select: ['grupoId'],
    });

    if (asignaciones.length === 0) {
      return {
        estudiantes: [],
        total: 0,
        vista: 'DOCENTE - Sin grupos asignados',
        mensaje: 'No tienes grupos asignados actualmente.',
      };
    }

    const grupoIds = [...new Set(asignaciones.map((a) => a.grupoId))];

    const matriculas = await this.matriculaRepo.find({
      where: { grupoId: In(grupoIds), estado: 'ACTIVA' },
      relations: ['estudiante', 'estudiante.persona', 'grupo'],
    });

    const estudiantesMap = new Map<number, any>();

    for (const m of matriculas) {
      const estId = Number(m.estudiante.id);
      if (!estudiantesMap.has(estId)) {
        estudiantesMap.set(estId, {
          id: estId,
          codigoEstudiante: m.estudiante.codigoEstudiante,
          estado: m.estudiante.estado,
          persona: {
            id: Number(m.estudiante.persona.id),
            nombres: m.estudiante.persona.nombres,
            apellidos: m.estudiante.persona.apellidos,
            nombreCompleto: `${m.estudiante.persona.nombres} ${m.estudiante.persona.apellidos}`,
            email: m.estudiante.persona.email,
            documento: m.estudiante.persona.documento,
            estado: m.estudiante.persona.estado,
          },
          grupos: [],
        });
      }
      estudiantesMap.get(estId).grupos.push({
        id: Number(m.grupo.id),
        codigo: m.grupo.codigo,
        nombre: m.grupo.nombre,
      });
    }

    const result = Array.from(estudiantesMap.values());

    return {
      estudiantes: result,
      total: result.length,
      vista: `DOCENTE - Solo tus estudiantes (${result.length} en ${grupoIds.length} grupo(s))`,
      docente: {
        id: Number(docente.id),
        codigoDocente: docente.codigoDocente,
        gruposAsignados: grupoIds.length,
      },
    };
  }
}
