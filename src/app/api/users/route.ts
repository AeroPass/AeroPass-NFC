import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const listQuerySchema = z.object({
  rol: z.string().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional(),
  q: z.string().optional(),
})

/**
 * GET /api/users
 *
 * Lista todos los usuarios con su persona y rol.
 * Requiere permiso: USUARIOS_LEER
 *
 * Filtros opcionales:
 *   ?rol=ADMIN          → filtra por código de rol
 *   ?estado=ACTIVO      → filtra por estado
 *   ?q=busqueda         → busca en username, nombres o apellidos
 */
export async function GET(req: NextRequest) {
  const { errorResponse } = await requirePermission(req, 'USUARIOS_LEER')
  if (errorResponse) return errorResponse

  const url = req.nextUrl
  const parsed = listQuerySchema.safeParse({
    rol: url.searchParams.get('rol') ?? undefined,
    estado: url.searchParams.get('estado') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { rol, estado, q } = parsed.data

  const where: Record<string, unknown> = {}
  if (estado) where.estado = estado
  if (rol) where.rol = { codigo: rol }
  if (q) {
    where.OR = [
      { username: { contains: q } },
      { persona: { nombres: { contains: q } } },
      { persona: { apellidos: { contains: q } } },
    ]
  }

  const usuarios = await db.usuario.findMany({
    where,
    select: {
      id: true,
      username: true,
      estado: true,
      ultimoAccesoAt: true,
      createdAt: true,
      updatedAt: true,
      persona: {
        select: { id: true, nombres: true, apellidos: true, email: true, documento: true, estado: true },
      },
      rol: { select: { id: true, codigo: true, nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Agregar nombreCompleto como campo calculado en la respuesta
  const result = usuarios.map((u) => ({
    ...u,
    persona: {
      ...u.persona,
      nombreCompleto: `${u.persona.nombres} ${u.persona.apellidos}`,
    },
  }))

  return NextResponse.json({ usuarios: result, total: result.length })
}

const createUserSchema = z.object({
  // Datos de la persona
  tipoDocumentoId: z.number().int().positive(),
  documento: z.string().min(1, 'El documento es obligatorio'),
  nombres: z.string().min(2, 'Los nombres son obligatorios'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  // Datos del usuario
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rolId: z.number().int().positive('El rol es obligatorio'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']).optional().default('ACTIVO'),
})

/**
 * POST /api/users
 *
 * Crea una persona + usuario (admin o docente).
 * Requiere permiso: USUARIOS_CREAR
 */
export async function POST(req: NextRequest) {
  const { errorResponse } = await requirePermission(req, 'USUARIOS_CREAR')
  if (errorResponse) return errorResponse

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = createUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { tipoDocumentoId, documento, nombres, apellidos, email, telefono, username, password, rolId, estado } = parsed.data

  // Validar duplicados: username, email, documento
  const existingUser = await db.usuario.findUnique({ where: { username } })
  if (existingUser) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese username.' }, { status: 409 })
  }

  if (email) {
    const existingEmail = await db.persona.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Ya existe una persona con ese email.' }, { status: 409 })
    }
  }

  const existingDoc = await db.persona.findFirst({
    where: { tipoDocumentoId, documento },
  })
  if (existingDoc) {
    return NextResponse.json({ error: 'Ya existe una persona con ese tipo y número de documento.' }, { status: 409 })
  }

  // Validar que el rol exista y esté activo
  const rol = await db.rol.findUnique({ where: { id: rolId } })
  if (!rol) {
    return NextResponse.json({ error: 'El rol especificado no existe.' }, { status: 400 })
  }
  if (rol.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'El rol está inactivo.' }, { status: 400 })
  }

  // Crear persona + usuario en una transacción
  const passwordHash = await hashPassword(password)
  const usuario = await db.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: { tipoDocumentoId, documento, nombres, apellidos, email, telefono, estado: 'ACTIVA' },
    })
    return tx.usuario.create({
      data: { personaId: persona.id, rolId, username, passwordHash, estado },
      include: {
        persona: { select: { id: true, nombres: true, apellidos: true, email: true, documento: true, estado: true } },
        rol: { select: { id: true, codigo: true, nombre: true } },
      },
    })
  })

  return NextResponse.json(
    {
      usuario: {
        id: usuario.id,
        username: usuario.username,
        estado: usuario.estado,
        ultimoAccesoAt: usuario.ultimoAccesoAt,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
        persona: {
          ...usuario.persona,
          nombreCompleto: `${usuario.persona.nombres} ${usuario.persona.apellidos}`,
        },
        rol: usuario.rol,
      },
    },
    { status: 201 }
  )
}
