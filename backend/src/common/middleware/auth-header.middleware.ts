import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware de prevalidación.
 *
 * No reemplaza al JwtAuthGuard: solo comprueba que las rutas protegidas
 * reciban una cabecera Authorization con formato Bearer. La verificación
 * criptográfica del JWT y la carga del usuario ocurren en el guard/strategy.
 */
@Injectable()
export class AuthHeaderMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') return next();

    const header = req.header('authorization');
    if (!header) {
      throw new UnauthorizedException('Falta la cabecera Authorization.');
    }

    if (!/^Bearer\s+\S+$/i.test(header)) {
      throw new UnauthorizedException(
        'La cabecera Authorization debe usar el formato Bearer <token>.',
      );
    }

    next();
  }
}
