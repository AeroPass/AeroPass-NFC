import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
export class EstudianteQueryDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', default: 200, minimum: 1, maximum: 500 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit = 200;
}
