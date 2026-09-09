import { Request } from 'express';
import { Role } from '../../common/enums/role.enum';

export interface AuthenticatedUser {
  id: number;
  role: Role;
}

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
