import { RoleCode } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  id: number;
  username: string;
  estado: string;
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
    codigo: RoleCode;
    nombre: string;
  };
  permisos: string[];
}
