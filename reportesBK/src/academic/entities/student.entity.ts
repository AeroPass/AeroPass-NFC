import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('estudiantes')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre' })
  name: string;

  @Column({ name: 'codigo_matricula', unique: true })
  enrollmentCode: string;
}
