import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/estudiantes
 *
 * Lista estudiantes:
 *   - ADMIN:   ve TODOS los estudiantes del sistema
 *   - DOCENTE: ve ÚNICAMENTE los estudiantes de SUS grupos
 *              (los grupos donde tiene asignaciones activas)
 *
 * Esto cumple el requisito del checklist:
 *   "los docentes solo pueden ver las listas de sus estudiantes"
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = await requireAuth(req)
  if (errorResponse || !user) return errorResponse

  if (user.rol.codigo === 'ADMIN') {
    // ===== ADMIN: ve todos los estudiantes =====
    const estudiantes = await db.estudiante.findMany({
      include: {
        persona: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            email: true,
            documento: true,
            estado: true,
          },
        },
        matriculas: {
          where: { estado: 'ACTIVA' },
          include: {
            grupo: {
              select: { id: true, codigo: true, nombre: true },
            },
          },
        },
      },
      orderBy: { persona: { apellidos: 'asc' } },
    })

    const result = estudiantes.map((e) => ({
      id: e.id,
      codigoEstudiante: e.codigoEstudiante,
      estado: e.estado,
      fechaIngreso: e.fechaIngreso,
      persona: {
        ...e.persona,
        nombreCompleto: `${e.persona.nombres} ${e.persona.apellidos}`,
      },
      grupos: e.matriculas.map((m) => m.grupo),
    }))

    return NextResponse.json({
      estudiantes: result,
      total: result.length,
      vista: 'ADMIN - Todos los estudiantes del sistema',
    })
  }

  if (user.rol.codigo === 'DOCENTE') {
    // ===== DOCENTE: ve SOLO sus estudiantes =====
    // 1. Buscar el registro del docente (vinculado a la persona)
    const docente = await db.docente.findFirst({
      where: { personaId: Number(user.persona.id) },
    })

    if (!docente) {
      return NextResponse.json({
        estudiantes: [],
        total: 0,
        vista: 'DOCENTE - No tienes registro de docente',
        mensaje: 'Tu persona no está registrada como docente en el sistema.',
      })
    }

    // 2. Buscar las asignaciones activas del docente (sus grupos)
    const asignaciones = await db.asignacionDocente.findMany({
      where: {
        docenteId: docente.id,
        estado: 'ACTIVA',
      },
      select: { grupoId: true, materiaId: true },
    })

    if (asignaciones.length === 0) {
      return NextResponse.json({
        estudiantes: [],
        total: 0,
        vista: 'DOCENTE - Sin grupos asignados',
        mensaje: 'No tienes grupos asignados actualmente.',
      })
    }

    const grupoIds = [...new Set(asignaciones.map((a) => a.grupoId))]

    // 3. Buscar estudiantes matriculados en esos grupos
    const matriculas = await db.matriculaGrupo.findMany({
      where: {
        grupoId: { in: grupoIds },
        estado: 'ACTIVA',
      },
      include: {
        estudiante: {
          include: {
            persona: {
              select: {
                id: true,
                nombres: true,
                apellidos: true,
                email: true,
                documento: true,
                estado: true,
              },
            },
          },
        },
        grupo: {
          select: { id: true, codigo: true, nombre: true },
        },
      },
      orderBy: { estudiante: { persona: { apellidos: 'asc' } } },
    })

    // 4. Agrupar por estudiante (un estudiante puede estar en varios grupos del docente)
    const estudiantesMap = new Map<number, {
      id: number
      codigoEstudiante: string
      estado: string
      persona: {
        id: number
        nombres: string
        apellidos: string
        nombreCompleto: string
        email: string | null
        documento: string
        estado: string
      }
      grupos: { id: number; codigo: string; nombre: string | null }[]
    }>()

    for (const m of matriculas) {
      const estId = m.estudiante.id
      if (!estudiantesMap.has(estId)) {
        estudiantesMap.set(estId, {
          id: m.estudiante.id,
          codigoEstudiante: m.estudiante.codigoEstudiante,
          estado: m.estudiante.estado,
          persona: {
            ...m.estudiante.persona,
            nombreCompleto: `${m.estudiante.persona.nombres} ${m.estudiante.persona.apellidos}`,
          },
          grupos: [],
        })
      }
      estudiantesMap.get(estId)!.grupos.push({
        id: m.grupo.id,
        codigo: m.grupo.codigo,
        nombre: m.grupo.nombre,
      })
    }

    const result = Array.from(estudiantesMap.values())

    return NextResponse.json({
      estudiantes: result,
      total: result.length,
      vista: `DOCENTE - Solo tus estudiantes (${result.length} en ${grupoIds.length} grupo(s))`,
      docente: {
        id: docente.id,
        codigoDocente: docente.codigoDocente,
        gruposAsignados: grupoIds.length,
      },
    })
  }

  // Otros roles (ADMINISTRATIVO, ESTUDIANTE) no pueden ver listas
  return NextResponse.json(
    {
      error: 'Su rol no tiene permiso para ver listas de estudiantes.',
      rol: user.rol.codigo,
    },
    { status: 403 }
  )
}
