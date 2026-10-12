import { IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAuditoriaDto {
  @IsOptional() @IsInt() @Min(1) usuarioId?: number;
  @IsOptional() @IsInt() @Min(1) dispositivoId?: number;
  @IsEnum(['CREATE','READ','UPDATE','DELETE','LOGIN','LOGOUT','ACCESS_DENIED','NFC_SCAN','CONFIG_CHANGE']) accion!: string;
  @IsString() @MaxLength(80) entidad!: string;
  @IsOptional() @IsString() @MaxLength(80) entidadId?: string;
  @IsOptional() @IsString() @MaxLength(40) resultado?: string;
  @IsOptional() @IsObject() datosAntes?: object;
  @IsOptional() @IsObject() datosDespues?: object;
  @IsOptional() @IsString() @MaxLength(1000) detalle?: string;
}
