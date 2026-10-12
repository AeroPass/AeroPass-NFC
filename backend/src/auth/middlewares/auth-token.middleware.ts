import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Middleware legado no registrado en AppModule: la autenticación se aplica mediante JwtAuthGuard, que respeta @Public(). */
@Injectable()
export class AuthTokenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const prefix = (process.env.API_PREFIX || 'api').replace(/^\/+|\/+$/g, '');
    const path = req.path.replace(new RegExp(`^/${prefix}(?=/|$)`), '');
    const publicPath = path === '/' || path === '/auth/login' || path.startsWith('/docs');
    if (publicPath || req.method === 'OPTIONS') return next();

    const authorization = req.get('authorization');
    if (!authorization) throw new UnauthorizedException('No autorizado. Debe enviar un token Bearer.');
    if (!/^Bearer\s+\S+$/i.test(authorization)) {
      throw new UnauthorizedException('Formato de Authorization inválido. Use Bearer <token>.');
    }
    next();
  }
}
