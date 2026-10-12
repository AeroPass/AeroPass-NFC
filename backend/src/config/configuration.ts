export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_DATABASE || 'control_acceso_nfc',
  },
  sigedinDatabase: {
    host: process.env.SIGEDIN_DB_HOST || '127.0.0.1',
    port: parseInt(process.env.SIGEDIN_DB_PORT || '3306', 10),
    username: process.env.SIGEDIN_DB_USERNAME || 'root',
    password: process.env.SIGEDIN_DB_PASSWORD || '',
    name: process.env.SIGEDIN_DB_DATABASE || 'sigedin',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
});
