import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'correo_electronico', unique: true })
  email: string;

  @Column({ name: 'contrasena_hash' })
  passwordHash: string;

  @Column({ name: 'rol', type: 'enum', enum: Role })
  role: Role;

  @Column({ name: 'activo', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
