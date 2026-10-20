function leerVariable(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) {
    throw new Error(`La variable de entorno ${nombre} es obligatoria.`);
  }
  return valor;
}

function leerNumero(nombre: string, minimo: number): number {
  const valor = Number(leerVariable(nombre));
  if (!Number.isSafeInteger(valor) || valor < minimo) {
    throw new Error(`${nombre} debe ser un número entero mayor o igual a ${minimo}.`);
  }
  return valor;
}

function leerPuerto(nombre: string): number {
  const puerto = leerNumero(nombre, 1);
  if (puerto > 65535) {
    throw new Error(`${nombre} debe ser un puerto válido entre 1 y 65535.`);
  }
  return puerto;
}

function leerBooleano(nombre: string): boolean {
  const valor = leerVariable(nombre).toLowerCase();
  if (valor !== 'true' && valor !== 'false') {
    throw new Error(`${nombre} debe ser "true" o "false".`);
  }
  return valor === 'true';
}

function validarZonaHoraria(zona: string): string {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zona });
  } catch {
    throw new Error('ATTENDANCE_TIME_ZONE debe ser una zona horaria IANA válida.');
  }
  return zona;
}

export default () => {
  const secretoJwt = leerVariable('JWT_SECRET');
  if (secretoJwt.length < 32 || secretoJwt.startsWith('CAMBIAR_')) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres y no ser el valor de ejemplo.');
  }
  const prefijoApi = leerVariable('API_PREFIX').replace(/^\/+|\/+$/g, '');
  if (!prefijoApi) {
    throw new Error('API_PREFIX no puede estar vacío.');
  }

  return {
    aplicacion: {
      puerto: leerPuerto('PORT'),
      prefijoApi,
    },
    baseDatos: {
      host: leerVariable('DB_HOST'),
      puerto: leerPuerto('DB_PORT'),
      usuario: leerVariable('DB_USERNAME'),
      contrasena: leerVariable('DB_PASSWORD'),
      nombre: leerVariable('DB_DATABASE'),
      sincronizar: leerBooleano('DB_SYNCHRONIZE'),
      registrarConsultas: leerBooleano('DB_LOGGING'),
    },
    baseDatosAcademica: {
      host: leerVariable('SIGEDIN_DB_HOST'),
      puerto: leerPuerto('SIGEDIN_DB_PORT'),
      usuario: leerVariable('SIGEDIN_DB_USERNAME'),
      contrasena: leerVariable('SIGEDIN_DB_PASSWORD'),
      nombre: leerVariable('SIGEDIN_DB_DATABASE'),
      sincronizar: leerBooleano('SIGEDIN_DB_SYNCHRONIZE'),
      registrarConsultas: leerBooleano('SIGEDIN_DB_LOGGING'),
    },
    jwt: {
      secreto: secretoJwt,
      expiracion: leerVariable('JWT_EXPIRES_IN'),
      emisor: leerVariable('JWT_ISSUER'),
      audiencia: leerVariable('JWT_AUDIENCE'),
    },
    asistencia: {
      zonaHoraria: validarZonaHoraria(leerVariable('ATTENDANCE_TIME_ZONE')),
      toleranciaTardanzaMinutos: leerNumero('ATTENDANCE_LATE_GRACE_MINUTES', 0),
      intervaloTapSegundos: leerNumero('NFC_TAP_COOLDOWN_SECONDS', 1),
    },
  };
};
