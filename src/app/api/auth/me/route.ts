import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

/**
 * GET /api/auth/me
 *
 * Devuelve el usuario autenticado a partir del JWT,
 * con su persona, rol y permisos cargados desde la BD.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json(
      { error: 'No autorizado. Token inválido o ausente.' },
      { status: 401 }
    )
  }
  return NextResponse.json({ user })
}
