import { Test } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RolPermiso } from '../roles/entities/rol-permiso.entity';
import { AuditService } from '../auditoria/audit.service';

describe('AuthService', () => {
  it('rechaza un estudiante aunque tenga credenciales', async () => {
    const hash = await argon2.hash('Password123');
    const usuario: any = { id: 7, username: 'estudiante7', passwordHash: hash, estado: 'ACTIVO', persona: { id: 8, estado: 'ACTIVA' }, rol: { id: 4, codigo: 'ESTUDIANTE', nombre: 'Estudiante', estado: 'ACTIVO' }, rolId: 4 };
    const repo = { createQueryBuilder: () => ({ addSelect() { return this; }, leftJoinAndSelect() { return this; }, where() { return this; }, getOne: async () => usuario }), update: jest.fn() };
    const rpRepo = { find: jest.fn().mockResolvedValue([]) };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const module = await Test.createTestingModule({ providers: [AuthService, { provide: getRepositoryToken(Usuario), useValue: repo }, { provide: getRepositoryToken(RolPermiso), useValue: rpRepo }, { provide: JwtService, useValue: { signAsync: jest.fn() } }, { provide: AuditService, useValue: audit }] }).compile();
    const service = module.get(AuthService);
    await expect(service.login({ username: 'estudiante7', password: 'Password123' })).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza una cuenta bloqueada', async () => {
    const usuario: any = { id: 7, username: 'bloqueado', passwordHash: await argon2.hash('Password123'), estado: 'BLOQUEADO', persona: { id: 8, estado: 'ACTIVA' }, rol: { id: 1, codigo: 'ADMIN', nombre: 'Administrador', estado: 'ACTIVO' }, rolId: 1 };
    const repo = { createQueryBuilder: () => ({ addSelect() { return this; }, leftJoinAndSelect() { return this; }, where() { return this; }, getOne: async () => usuario }) };
    const module = await Test.createTestingModule({ providers: [AuthService, { provide: getRepositoryToken(Usuario), useValue: repo }, { provide: getRepositoryToken(RolPermiso), useValue: { find: jest.fn() } }, { provide: JwtService, useValue: { signAsync: jest.fn() } }, { provide: AuditService, useValue: { log: jest.fn() } }] }).compile();
    await expect(module.get(AuthService).login({ username: 'bloqueado', password: 'Password123' })).rejects.toThrow(ConflictException);
  });
});
