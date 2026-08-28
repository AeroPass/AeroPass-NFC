import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('course_subjects')
export class CourseSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseName: string;

  @Column()
  subjectName: string;

  @Column()
  teacherId: number;
}
