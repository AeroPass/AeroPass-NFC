import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cursos_materias')
export class CourseSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre_curso' })
  courseName: string;

  @Column({ name: 'nombre_materia' })
  subjectName: string;

  @Column({ name: 'docente_id' })
  teacherId: number;
}
