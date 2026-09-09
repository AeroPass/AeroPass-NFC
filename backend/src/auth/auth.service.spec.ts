import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { AuditService } from '../auditoria/audit.service.js';
import { Usuario } from '../entities/usuario.entity.js';
import { RolPermiso } from '../entities/rol-permiso.entity.js';

const buildUsuario = async (overrides: Partial<Usuario> = {}): Promise<Usuario> => {
  return {
    id: 1,
    username: 'admin',
    estado: 'ACTIVO',
    passwordHash: await argon2.hash('admin123'),
    ultimoAccesoAt: new Date('2025-01-01T00:00:00Z'),
    rolId: 1,
    personaId: 1,
    persona: {
      id: 1,
      estado: 'ACTIVA',
      nombres: 'Admin',
      apellidos: 'Principal',
      email: 'admin@nfc.edu',
      documento: '1000000001',
    },
    rol: { id: 1, codigo: 'ADMIN', nombre: 'Administrador', estado: 'ACTIVO' },
    ...overrides,
  } as unknown as Usuario;
};

describe('AuthService - login', () => {
  let service: AuthService;
  let builder: {
    leftJoinAndSelect: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
  };
  let usuarioRepo: { createQueryBuilder: jest.Mock; update: jest.Mock };
  let rolPermisoRepo: { find: jest.Mock };
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    builder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    usuarioRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
      update: jest.fn().mockResolvedValue(undefined),
    };
    rolPermisoRepo = { find: jest.fn().mockResolvedValue([]) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: getRepositoryToken(RolPermiso), useValue: rolPermisoRepo },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('token-de-prueba') } },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rechaza credenciales incorrectas con 401 y audita el fallo', async () => {
    builder.getOne.mockResolvedValue(await buildUsuario());
    await expect(
      service.login({ username: 'admin', password: 'clave-mala' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'FALLIDO' }),
    );
  });

  it('devuelve 401 (NO 500) cuando el hash almacenado es un placeholder corrupto', async () => {
    builder.getOne.mockResolvedValue(
      await buildUsuario({ passwordHash: 'REEMPLAZAR_CON_HASH_ARGON2_DE_ADMIN123' }),
    );
    await expect(
      service.login({ username: 'admin', password: 'admin123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza con 403 las cuentas BLOQUEADO', async () => {
    builder.getOne.mockResolvedValue(await buildUsuario({ estado: 'BLOQUEADO' }));
    await expect(
      service.login({ username: 'admin', password: 'admin123' }),
    ).rejects.toThrow(ConflictException);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'FALLIDO', detalle: 'Cuenta bloqueada' }),
    );
  });

  it('usuario inexistente responde 401 (y ejecuta verify dummy por timing)', async () => {
    builder.getOne.mockResolvedValue(null);
    await expect(
      service.login({ username: 'fantasma', password: 'loquesea' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ entidadId: 'fantasma', resultado: 'FALLIDO' }),
    );
  });

  it('login exitoso devuelve token y el último acceso ANTERIOR', async () => {
    const usuario = await buildUsuario();
    builder.getOne.mockResolvedValue(usuario);
    const respuesta = await service.login({ username: 'admin', password: 'admin123' });
    expect(respuesta.token).toBe('token-de-prueba');
    expect(respuesta.user.ultimoAccesoAt).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ resultado: 'EXITOSO' }),
    );
  });
});
