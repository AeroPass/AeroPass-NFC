import { Request } from 'express';
import { Role } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  id: number;
  username: string;
  estado: string;
  ultimoAccesoAt: Date | null;
  persona: {
    id: number;
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    email: string | null;
    documento: string;
    estado: string;
  };
  rol: {
    id: number;
    codigo: Role;
    nombre: string;
  };
  permisos: string[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
