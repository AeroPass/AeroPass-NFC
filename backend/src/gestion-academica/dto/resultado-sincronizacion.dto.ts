export class ResultadoSincronizacionDto {
  iniciadoEn!: string;
  finalizadoEn!: string;
  registrosProcesados!: Record<string, number>;
}
