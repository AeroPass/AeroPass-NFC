import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('enrollments')
@Unique(['courseSubjectId', 'studentId'])
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseSubjectId: number;

  @Column()
  studentId: number;
}
