import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, signToken, loadUsuarioCompleto } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

/**
 * POST /api/auth/login
 *
 * Autentica a un usuario contra la tabla `usuarios` del esquema
 * control_acceso_nfc. Devuelve un JWT firmado con los permisos del rol.
 *
 * Body:
 *   { "username": "admin", "password": "admin123" }
 *
 * Estados verificadas:
 *   - usuarios.estado = 'ACTIVO'
 *   - personas.estado  = 'ACTIVA'
 *   - roles.estado     = 'ACTIVO'
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la petición inválido (se espera JSON).' },
      { status: 400 }
    )
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { username, password } = parsed.data

  // 1. Buscar usuario por username
  const usuario = await db.usuario.findUnique({
    where: { username },
    include: {
      persona: true,
      rol:     true,
    },
  })

  if (!usuario) {
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos.' },
      { status: 401 }
    )
  }

  // 2. Verificar estado del usuario
  if (usuario.estado === 'BLOQUEADO') {
    return NextResponse.json(
      { error: 'Su cuenta está bloqueada. Contacte al administrador.' },
      { status: 403 }
    )
  }
  if (usuario.estado === 'INACTIVO') {
    return NextResponse.json(
      { error: 'Su cuenta está inactiva. Contacte al administrador.' },
      { status: 403 }
    )
  }
  if (usuario.persona.estado !== 'ACTIVA') {
    return NextResponse.json(
      { error: 'La persona asociada está inactiva.' },
      { status: 403 }
    )
  }
  if (usuario.rol.estado !== 'ACTIVO') {
    return NextResponse.json(
      { error: 'El rol asignado está inactivo.' },
      { status: 403 }
    )
  }

  // 3. Verificar contraseña contra password_hash
  const valid = await comparePassword(password, usuario.passwordHash)
  if (!valid) {
    return NextResponse.json(
      { error: 'Usuario o contraseña incorrectos.' },
      { status: 401 }
    )
  }

  // 4. Cargar permisos completos del rol y firmar el JWT
  const completo = await loadUsuarioCompleto(usuario.id)
  if (!completo) {
    return NextResponse.json(
      { error: 'No se pudo cargar el usuario.' },
      { status: 500 }
    )
  }

  const token = signToken({
    userId: String(completo.id),
    username: completo.username,
    rolCodigo: completo.rol.codigo,
    rolNombre: completo.rol.nombre,
    personaId: String(completo.persona.id),
    permisos: completo.permisos,
  })

  // 5. Actualizar ultimo_acceso_at
  await db.usuario.update({
    where: { id: usuario.id },
    data: { ultimoAccesoAt: new Date() },
  })

  return NextResponse.json({
    message: 'Login exitoso',
    user: completo,
    token,
  })
}
