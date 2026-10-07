import { IsOptional, IsString } from 'class-validator';

export class PermisosQueryDto {
  @IsOptional()
  @IsString()
  modulo?: string;
}
