import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'Username de la cuenta. También se acepta email como identificador.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  identifier: string;

  @ApiProperty({ example: 'admin123', description: 'Contraseña de la cuenta.' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
