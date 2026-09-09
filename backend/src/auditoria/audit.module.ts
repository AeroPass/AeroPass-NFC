import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service.js';
import { AuditoriaEvento } from '../entities/auditoria-evento.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaEvento])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
