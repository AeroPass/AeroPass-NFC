export default () => {
  const jwtSecret = process.env.JWT_SECRET || 'dev-only-change-this-secret-to-at-least-32-characters';
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production' && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }

  return {
    port: Number(process.env.PORT || 3000),
    database: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      name: process.env.DB_DATABASE || 'control_acceso_nfc',
    },
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      issuer: process.env.JWT_ISSUER || 'AeroPass-NFC',
      audience: process.env.JWT_AUDIENCE || 'AeroPass-NFC-api',
    },
    security: {
      syncRolesPermissions: process.env.SECURITY_SYNC_ROLES_PERMISSIONS !== 'false',
    },
    sigedin: {
      host: process.env.SIGEDIN_DB_HOST || '127.0.0.1',
      port: Number(process.env.SIGEDIN_DB_PORT || 3306),
      username: process.env.SIGEDIN_DB_USERNAME || 'root',
      password: process.env.SIGEDIN_DB_PASSWORD || '',
      database: process.env.SIGEDIN_DB_DATABASE || 'sigedin',
    },
  };
};
