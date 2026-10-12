import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
export class RoleIdDto {
  @ApiProperty({ description: 'ID del rol', example: 1, minimum: 1 })
  @IsInt() @Min(1) id!: number;
}
