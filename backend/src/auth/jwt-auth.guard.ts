import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedUser } from './interfaces/authenticated-request.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly configuracion: ConfigService,
  ) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const prefijoApi = this.configuracion.getOrThrow<string>('aplicacion.prefijoApi');
    const prefijoRuta = `/${prefijoApi}`;
    const ruta = request.path ?? '';
    const path = ruta === prefijoRuta
      ? '/'
      : ruta.startsWith(`${prefijoRuta}/`)
        ? ruta.slice(prefijoRuta.length)
        : ruta;
    if (path === '/docs' || path.startsWith('/docs/')) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | null | undefined,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('No autorizado. Token inválido o ausente.');
    }
    return user;
  }
}
