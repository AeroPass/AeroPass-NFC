import { Role, LOGIN_ENABLED_ROLES } from '../enums/role.enum';
describe('role policy', () => { it('excludes ESTUDIANTE from login', () => { expect(LOGIN_ENABLED_ROLES).toEqual([Role.ADMIN, Role.DOCENTE, Role.ADMINISTRATIVO]); }); });
