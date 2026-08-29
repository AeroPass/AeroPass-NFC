import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { z } from 'zod'

/**
 * GET /api/roles
 *
 * Lista todos los roles con sus permisos asignados.
 * Requiere permiso: ROLES_GESTIONAR (o cualquier autenticado para solo ver nombres)
 *
 * Con ?includePermisos=true incluye los permisos de cada rol.
 */
export async function GET(req: NextRequest) {
  // Cualquier usuario autenticado puede ver los roles
  const { errorResponse } = await requirePermission(req, 'AUTH_LOGIN')
  if (errorResponse) return errorResponse

  const includePermisos = req.nextUrl.searchParams.get('includePermisos') === 'true'

  const roles = await db.rol.findMany({
    include: includePermisos
      ? {
          rolPermisos: {
            include: {
              permiso: { select: { id: true, codigo: true, nombre: true, modulo: true } },
            },
          },
        }
      : false,
    orderBy: { id: 'asc' },
  })

  const result = roles.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    descripcion: r.descripcion,
    estado: r.estado,
    permisos: includePermisos ? r.rolPermisos?.map((rp) => rp.permiso) : undefined,
    totalPermisos: includePermisos ? r.rolPermisos?.length ?? 0 : undefined,
  }))

  return NextResponse.json({ roles: result, total: result.length })
}

const createRolSchema = z.object({
  codigo: z.string().min(2, 'El código es obligatorio').max(40),
  nombre: z.string().min(2, 'El nombre es obligatorio').max(80),
  descripcion: z.string().max(255).optional().nullable(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional().default('ACTIVO'),
  permisosIds: z.array(z.number().int().positive()).optional().default([]),
})

/**
 * POST /api/roles
 *
 * Crea un nuevo rol y le asigna permisos (opcional).
 * Requiere permiso: ROLES_GESTIONAR
 */
export async function POST(req: NextRequest) {
  const { errorResponse } = await requirePermission(req, 'ROLES_GESTIONAR')
  if (errorResponse) return errorResponse

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = createRolSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { codigo, nombre, descripcion, estado, permisosIds } = parsed.data

  // Validar duplicados
  const existingCodigo = await db.rol.findUnique({ where: { codigo } })
  if (existingCodigo) {
    return NextResponse.json({ error: 'Ya existe un rol con ese código.' }, { status: 409 })
  }
  const existingNombre = await db.rol.findUnique({ where: { nombre } })
  if (existingNombre) {
    return NextResponse.json({ error: 'Ya existe un rol con ese nombre.' }, { status: 409 })
  }

  // Validar permisos
  if (permisosIds.length > 0) {
    const permisosExistentes = await db.permiso.findMany({
      where: { id: { in: permisosIds } },
      select: { id: true },
    })
    if (permisosExistentes.length !== permisosIds.length) {
      return NextResponse.json(
        { error: 'Uno o más permisos especificados no existen.' },
        { status: 400 }
      )
    }
  }

  // Crear rol + asignar permisos en transacción
  const rol = await db.$transaction(async (tx) => {
    const nuevo = await tx.rol.create({
      data: { codigo, nombre, descripcion, estado },
    })

    if (permisosIds.length > 0) {
      await tx.rolPermiso.createMany({
        data: permisosIds.map((permisoId) => ({ rolId: nuevo.id, permisoId })),
      })
    }

    return nuevo
  })

  return NextResponse.json({ rol }, { status: 201 })
}
