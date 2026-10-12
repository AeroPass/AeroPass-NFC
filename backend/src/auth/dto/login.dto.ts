import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  username!: string;

  @ApiProperty({ example: '********' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
