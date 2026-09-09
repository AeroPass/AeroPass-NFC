import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('matriculas')
@Unique(['courseSubjectId', 'studentId'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'curso_materia_id' })
  courseSubjectId: number;

  @Column({ name: 'estudiante_id' })
  studentId: number;
}
