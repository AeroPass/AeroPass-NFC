# AeroPass-NFC Backend — versión asegurada

Backend NestJS alineado con la base de datos `control_acceso_nfc` entregada para el proyecto.

## Incluye

- Entidades TypeORM de los módulos que ya existen en `src`.
- DTOs de entrada y consulta para cada módulo operativo.
- Autenticación JWT con Passport.
- `JwtAuthGuard` global y validación de sesión contra la BD.
- Middleware de validación de encabezado `Authorization: Bearer ...`.
- Decorador personalizado `@Roles(...)` y `RolesGuard`.
- Decorador `@RequirePermissions(...)` y `PermissionsGuard`.
- Sincronización de los cuatro roles de la matriz entregada:
  - `ADMIN` → Super Admin
  - `ADMINISTRATIVO` → Administrador
  - `DOCENTE` → Profesor
  - `ESTUDIANTE` → Estudiante
- Regla especial: el estudiante existe para matrícula/asistencia/auditoría, pero no puede tener cuenta ni autenticarse.
- Compatibilidad de migración para la cuenta existente cuyo hash de contraseña está en SHA-256: al iniciar sesión correctamente se actualiza a Argon2id.
- Documentación OpenAPI en `/docs`.
- Colección de Postman en `postman/AeroPass-NFC.postman_collection.json`.

## Inicio

1. Ejecuta el SQL suministrado en MySQL.
2. Copia `.env.example` a `.env` y ajusta la conexión.
3. Ejecuta `npm install`.
4. Ejecuta `npm run build`.
5. Ejecuta `npm run start:dev`.
6. Abre `http://localhost:3000/docs`.

## Login

`POST /auth/login`

```json
{
  "identifier": "admin",
  "password": "admin123"
}
```

La cuenta que ya venía en la BD se detecta como hash SHA-256 legado y, si las credenciales son correctas, se actualiza automáticamente a Argon2id.

## Seguridad de rutas

La aplicación registra tres guards globales en este orden:

1. `JwtAuthGuard` — autentica el token.
2. `RolesGuard` — valida `@Roles(...)`.
3. `PermissionsGuard` — valida `@RequirePermissions(...)`.

Esto mantiene separada la autenticación de la autorización y hace que `request.user` exista antes de comprobar roles/permisos.

El middleware `AuthHeaderMiddleware` verifica que las rutas protegidas reciban el encabezado Bearer; la verificación criptográfica del JWT queda a Passport/`JwtAuthGuard`.

## Estudiante

No se permite crear ni modificar una cuenta de usuario para el rol `ESTUDIANTE`. Además, la estrategia JWT rechaza cualquier token asociado a ese rol, incluso si alguien intentara insertar manualmente una cuenta en la base de datos.

## `uid_leido`

La tabla `lecturas_nfc` contiene el campo `uid_leido`, pero se deja deliberadamente fuera de las entidades/DTOs de esta entrega, conforme a la indicación del proyecto.
