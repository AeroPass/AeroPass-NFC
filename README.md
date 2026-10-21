<p align="center">
  <a href="https://github.com/AeroPass/AeroPass-NFC">
    <img src="https://img.shields.io/badge/AeroPass-NFC-145DA0?style=for-the-badge" alt="AeroPass NFC" />
  </a>
</p>

<h1 align="center">AeroPass NFC</h1>

<p align="center">
  Sistema de gestión de acceso físico y registro de asistencia mediante tarjetas NFC,
  con una API REST y un agente local de lectura compatible con PC/SC.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D%2020-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 20 o superior" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-%3E%3D%203.10-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.10 o superior" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/WebSocket-Local%20NFC-333333?style=flat-square" alt="WebSocket" />
  <a href="https://github.com/AeroPass/AeroPass-NFC/stargazers">
    <img src="https://img.shields.io/github/stars/AeroPass/AeroPass-NFC?style=flat-square" alt="GitHub stars" />
  </a>
  <a href="https://github.com/AeroPass/AeroPass-NFC/network/members">
    <img src="https://img.shields.io/github/forks/AeroPass/AeroPass-NFC?style=flat-square" alt="GitHub forks" />
  </a>
</p>

<p align="center">
  <a href="#descripción">Descripción</a> ·
  <a href="#arquitectura">Arquitectura</a> ·
  <a href="#tecnologías">Tecnologías</a> ·
  <a href="#instalación">Instalación</a> ·
  <a href="#configuración">Configuración</a> ·
  <a href="#seguridad">Seguridad</a>
</p>

---

## Descripción

**AeroPass NFC** es una solución para administrar procesos de acceso físico y asistencia apoyados en tarjetas NFC. El repositorio contiene dos componentes principales: un backend que centraliza la lógica de negocio, la persistencia y la autorización, y un agente local que se comunica con el lector NFC del equipo y transmite los identificadores de las tarjetas mediante WebSocket.

El backend organiza funcionalidades relacionadas con autenticación, usuarios, estudiantes, roles, permisos, tarjetas, asistencia, reportes, auditoría e integración académica. La lectura de una tarjeta no depende de que el servidor web acceda directamente al hardware: esa tarea se delega al agente que se ejecuta en el equipo donde está conectado el lector.

## Funcionalidades principales

- **Autenticación:** inicio de sesión mediante JWT y Passport.
- **Autorización:** controles de acceso mediante roles y permisos asociados a las rutas.
- **Gestión de usuarios y roles:** separación de responsabilidades para administración, personal administrativo, docentes y estudiantes.
- **Integración académica:** conexión a una base de datos SIGEDIN, independiente de la base principal de AeroPass.
- **Lectura NFC local:** comunicación con lectores compatibles con PC/SC a través de las interfaces nativas del sistema operativo.
- **Modos de lectura:** modo de enfoque y modo continuo, con control del ciclo de lectura y prevención de lecturas repetidas mientras la tarjeta permanece en el campo del lector.
- **Asistencia y auditoría:** módulos dedicados al registro de asistencia, tarjetas y eventos relevantes del sistema.
- **Documentación de API:** especificación interactiva con Swagger/OpenAPI.
- **Pruebas y despliegue local:** pruebas automatizadas para el backend y para la lógica del agente; además, hay scripts de despliegue del agente para los sistemas operativos compatibles.

> **Alcance del repositorio:** la estructura disponible contiene `backend/` y `agente-nfc/`. No aparece una carpeta de frontend dentro de este repositorio; la aplicación web que consume la API y se conecta al WebSocket debe configurarse por separado.

## Arquitectura

```text
┌──────────────────────────────┐
│ Frontend / aplicación cliente│
└──────────────┬───────────────┘
               │ HTTPS/HTTP: API REST
               ▼
┌──────────────────────────────┐
│ Backend NestJS               │
│ JWT · Roles · Permisos        │
│ Usuarios · Tarjetas           │
│ Asistencia · Reportes         │
│ Auditoría · Gestión académica │
└──────────────┬───────────────┘
               │ TypeORM / MySQL
        ┌──────┴───────────┐
        ▼                  ▼
┌────────────────┐  ┌────────────────┐
│ Base AeroPass  │  │ Base SIGEDIN    │
└────────────────┘  └────────────────┘

┌──────────────────────────────┐
│ Lector NFC conectado al equipo│
└──────────────┬───────────────┘
               │ PC/SC nativo
               ▼
┌──────────────────────────────┐
│ Agente local Python           │
│ Lectura UID · Estado · WebSocket│
└──────────────┬───────────────┘
               │ ws://127.0.0.1:8765–8770
               ▼
┌──────────────────────────────┐
│ Frontend / aplicación cliente│
└──────────────────────────────┘
```

### Componentes

| Componente | Responsabilidad | Tecnologías principales |
|---|---|---|
| `backend/` | API REST, persistencia, autenticación, autorización y módulos funcionales. | Node.js, NestJS, TypeScript, TypeORM, MySQL |
| `agente-nfc/` | Detección de tarjetas y envío de UID/estados al cliente conectado. | Python, WebSocket, PC/SC nativo |
| Base AeroPass | Datos operativos de AeroPass NFC. | MySQL |
| Base SIGEDIN | Datos académicos consultados por la integración. | MySQL |

## Tecnologías

### Backend

- **Node.js 20 o superior** como entorno de ejecución.
- **NestJS 11** para la estructura modular de la API.
- **TypeScript 5.8** para tipado estático.
- **TypeORM** y `mysql2` para el acceso a MySQL.
- **Passport, `passport-jwt` y `@nestjs/jwt`** para el esquema de autenticación basado en JWT.
- **Argon2id** para el almacenamiento de contraseñas con hash seguro.
- **`class-validator` y `class-transformer`** para validar y transformar datos de entrada.
- **Swagger/OpenAPI** para explorar y probar los endpoints documentados.
- **Jest** para las pruebas automatizadas.
- **PDFKit** como dependencia para la generación de documentos PDF donde corresponda.

### Agente NFC

- **Python 3.10 o superior**.
- **`websockets==16.1.1`** para el servidor WebSocket local.
- **PC/SC** para comunicarse con el lector a través de las APIs nativas del sistema operativo.
- **`ctypes`** para invocar las interfaces nativas: WinSCard en Windows, `pcsc-lite` en Linux y `PCSC.framework` en macOS.
- **`unittest`** para probar la lógica del agente sin requerir un lector NFC físico.

## Estructura del repositorio

```text
AeroPass-NFC/
├── agente-nfc/
│   ├── nfc_agent/
│   │   ├── domain/          # Estados, modos y contratos del lector
│   │   ├── application/     # Ciclo de lectura y control de concurrencia
│   │   ├── hardware/        # Adaptador PC/SC y acceso al lector
│   │   ├── transport/       # Servidor WebSocket y mensajes
│   │   └── config.py        # Configuración por entorno
│   ├── tests/               # Pruebas del agente con hardware simulado
│   ├── deploy/              # Plantillas de ejecución en segundo plano
│   ├── scripts/             # Scripts de instalación y administración
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── backend/
│   ├── src/
│   │   ├── auth/            # Autenticación y autorización
│   │   ├── usuarios/        # Gestión de usuarios
│   │   ├── estudiantes/     # Gestión de estudiantes
│   │   ├── roles/           # Roles del sistema
│   │   ├── permisos/        # Permisos de acceso
│   │   ├── attendance/      # Registro de asistencia
│   │   ├── reportes/        # Reportes
│   │   ├── tarjetas/        # Gestión de tarjetas NFC
│   │   ├── gestion-academica/ # Integración académica
│   │   ├── auditoria/       # Auditoría
│   │   └── common/          # Guards, filtros y elementos compartidos
│   ├── postman/             # Colección de pruebas de la API
│   ├── .env.example
│   ├── package.json
│   └── README.md
└── README.md
```

## Requisitos previos

Antes de ejecutar el proyecto, instala y configura lo siguiente:

1. **Git** para clonar el repositorio.
2. **Node.js 20 o superior** y npm para el backend.
3. **Python 3.10 o superior** para el agente NFC.
4. **MySQL** con acceso a las dos bases de datos configuradas: AeroPass y SIGEDIN.
5. Un **lector NFC compatible con PC/SC**, junto con los controladores y servicios correspondientes al sistema operativo.
6. El esquema SQL del proyecto, que debe importarse en MySQL antes de iniciar el backend.

El agente requiere que el lector permita obtener el UID mediante el comando APDU `FF CA 00 00 00`. La compatibilidad depende del modelo concreto del lector; conviene comprobarla antes de preparar el entorno definitivo.

### Dependencias del lector por sistema operativo

- **Windows:** instala el controlador del fabricante y verifica que el servicio Smart Card esté iniciado. El agente utiliza `winscard.dll` del sistema.
- **Linux:** instala y activa `pcsc-lite`/`pcscd` y las herramientas PC/SC de la distribución. Puedes comprobar si el lector se detecta con `pcsc_scan`.
- **macOS:** instala el middleware del fabricante cuando sea necesario. El agente intenta utilizar `PCSC.framework`.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AeroPass/AeroPass-NFC.git
cd AeroPass-NFC
```

### 2. Configurar e iniciar el backend

Los comandos de Node.js deben ejecutarse dentro de `backend/`, donde se encuentra `package.json`.

#### Linux / macOS

```bash
cd backend
npm install
cp .env.example .env
```

#### Windows PowerShell

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edita `backend/.env` y configura la conexión a las dos bases de datos, el puerto, el prefijo de API y el secreto JWT. Antes de iniciar, importa el esquema SQL correspondiente y comprueba que ambas bases de datos sean accesibles desde el backend.

Compila y ejecuta en modo desarrollo:

```bash
npm run build
npm run start:dev
```

Con la configuración predeterminada, el backend queda disponible en `http://localhost:3000` y la documentación interactiva en:

**http://localhost:3000/api/docs**

Para ejecutar la versión compilada:

```bash
npm run build
npm start
```

### 3. Configurar e iniciar el agente NFC

El agente se ejecuta en el equipo físico que tiene conectado el lector. Abre otra terminal desde la raíz del repositorio.

#### Linux / macOS

```bash
cd agente-nfc
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python -m unittest discover -s tests -v
python -m nfc_agent
```

#### Windows PowerShell

```powershell
cd agente-nfc
py -3 --version
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m unittest discover -s tests -v
python -m nfc_agent
```

Si PowerShell no permite activar el entorno virtual, se pueden ejecutar los comandos usando directamente `\.venv\Scripts\python.exe`.

Al iniciar, el agente prueba los puertos configurados y utiliza el primero que esté disponible. Por defecto, escucha en `127.0.0.1` y prueba los puertos `8765` a `8770`.

### Orden de arranque recomendado

1. Iniciar MySQL y comprobar la existencia de las bases de datos.
2. Iniciar el backend y verificar su conexión con ambas bases de datos.
3. Iniciar el agente en el equipo que tenga conectado el lector NFC.
4. Abrir el frontend o cliente correspondiente y verificar la conexión a la API y al WebSocket local.
5. Consultar la documentación Swagger para comprobar los endpoints y sus esquemas.

## Configuración

### Backend: `backend/.env`

Usa `backend/.env.example` como plantilla y modifica los valores para tu entorno. Las variables principales son:

| Variable | Valor de referencia | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Entorno de ejecución. |
| `PORT` | `3000` | Puerto HTTP de la API. |
| `API_PREFIX` | `api` | Prefijo global de los endpoints. |
| `DB_HOST` | `localhost` | Host de la base de datos principal. |
| `DB_PORT` | `3306` | Puerto MySQL principal. |
| `DB_USERNAME` | Según tu entorno | Usuario MySQL principal. |
| `DB_PASSWORD` | Definido localmente | Contraseña MySQL principal. |
| `DB_DATABASE` | `aeropass_nfc` en la plantilla | Nombre de la base principal. Debe coincidir con el esquema importado. |
| `DB_SYNCHRONIZE` | `false` | Control de sincronización automática de TypeORM. |
| `DB_LOGGING` | `false` | Activa o desactiva el registro de consultas. |
| `SIGEDIN_DB_HOST` | `localhost` | Host de la base académica SIGEDIN. |
| `SIGEDIN_DB_PORT` | `3306` | Puerto de la base académica. |
| `SIGEDIN_DB_USERNAME` | Según tu entorno | Usuario MySQL de SIGEDIN. |
| `SIGEDIN_DB_PASSWORD` | Definido localmente | Contraseña MySQL de SIGEDIN. |
| `SIGEDIN_DB_DATABASE` | `sigedin` en la plantilla | Nombre de la base académica. |
| `SIGEDIN_DB_SYNCHRONIZE` | `false` | Control de sincronización automática de TypeORM para SIGEDIN. |
| `SIGEDIN_DB_LOGGING` | `false` | Activa o desactiva el registro de consultas de SIGEDIN. |
| `JWT_SECRET` | Secreto aleatorio propio | Clave de firma JWT; debe tener al menos 32 caracteres aleatorios. |
| `JWT_EXPIRES_IN` | `8h` | Duración del token JWT. |
| `JWT_ISSUER` | `AeroPass-NFC` | Emisor esperado del token. |
| `JWT_AUDIENCE` | `AeroPass-NFC-api` | Audiencia esperada del token. |
| `ATTENDANCE_TIME_ZONE` | `America/Bogota` | Zona horaria para el registro de asistencia. |
| `ATTENDANCE_LATE_GRACE_MINUTES` | `10` | Minutos de tolerancia configurados para tardanzas. |
| `NFC_TAP_COOLDOWN_SECONDS` | `5` | Intervalo de enfriamiento configurado para lecturas NFC. |

**Importante sobre el nombre de la base de datos:** `backend/.env.example` utiliza `aeropass_nfc`, mientras que el README interno del backend menciona `control_acceso_nfc`. Antes de ejecutar el proyecto, verifica el nombre real definido en el SQL suministrado y ajusta `DB_DATABASE` para que ambas configuraciones coincidan. La conexión con SIGEDIN también debe configurarse porque el backend declara ambas conexiones.

No publiques el archivo `.env`, contraseñas, tokens ni secretos de producción en el repositorio.

### Agente NFC: `agente-nfc/.env`

Usa `agente-nfc/.env.example` como plantilla.

| Variable | Valor predeterminado | Descripción |
|---|---|---|
| `NFC_AGENT_HOST` | `127.0.0.1` | Dirección de escucha. Por seguridad, el valor predeterminado es loopback. |
| `NFC_AGENT_PORTS` | `8765,8766,8767,8768,8769,8770` | Puertos que prueba el agente en orden. |
| `NFC_AGENT_ORIGINS` | Orígenes locales en puertos `5500` y `3000` | Lista separada por comas de los orígenes web autorizados. |
| `NFC_AGENT_TOKEN` | Vacío | Si se configura, el cliente debe autenticarse antes de enviar comandos. |
| `NFC_AGENT_POLL_INTERVAL` | `0.35` | Intervalo de sondeo en segundos; rango admitido de `0.05` a `10`. |
| `NFC_AGENT_READER_NAME` | Vacío | Nombre exacto del lector PC/SC. Si queda vacío, se selecciona el primer lector disponible. |
| `NFC_AGENT_DATA_DIR` | Directorio de datos del usuario | Ubicación opcional para el identificador persistente y los logs. |

Las variables de entorno del sistema tienen prioridad sobre los valores almacenados en `.env`. Si el frontend utiliza un puerto distinto, agrega su origen a `NFC_AGENT_ORIGINS`, incluyendo el protocolo, host y puerto.

## API y autenticación

### Documentación interactiva

Con el backend iniciado, accede a:

```text
http://localhost:3000/api/docs
```

Swagger permite consultar las rutas documentadas, los parámetros, los modelos de solicitud y respuesta, e introducir un token Bearer para probar operaciones protegidas.

### Inicio de sesión

La ruta de autenticación documentada por el backend es `POST /auth/login`; con el prefijo global predeterminado, la URL completa es:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

Cuerpo de ejemplo:

```json
{
  "identifier": "<identificador-de-usuario>",
  "password": "<contraseña>"
}
```

Utiliza una cuenta válida creada y autorizada en el entorno configurado. No reutilices contraseñas de demostración ni credenciales de desarrollo en un despliegue real.

### Roles del sistema

El backend contempla la siguiente correspondencia de roles:

| Rol técnico | Nombre funcional |
|---|---|
| `ADMIN` | Super Admin |
| `ADMINISTRATIVO` | Administrador |
| `DOCENTE` | Profesor |
| `ESTUDIANTE` | Estudiante |

El flujo de autorización utiliza guards globales para autenticar el JWT y después validar roles y permisos. La validación de DTOs está configurada para transformar entradas, eliminar propiedades no permitidas y rechazar campos adicionales no definidos.

Por regla de negocio, el estudiante puede figurar en los procesos de matrícula, asistencia y auditoría, pero **no debe tener cuenta de acceso ni autenticarse**. La estrategia JWT también rechaza tokens asociados al rol `ESTUDIANTE`.

### Almacenamiento de contraseñas

El backend usa Argon2id para el hash de contraseñas. Para compatibilidad con una cuenta existente cuyo hash estaba almacenado en SHA-256, el código contempla actualizar el hash a Argon2id después de un inicio de sesión exitoso. Esta migración está destinada a compatibilidad con registros heredados, no a usar SHA-256 como mecanismo nuevo de almacenamiento de contraseñas.

## Agente NFC y protocolo WebSocket

El agente mantiene un proceso local activo, gestiona el ciclo de lectura del hardware y transmite eventos al cliente mediante WebSocket. No ofrece un endpoint HTTP de descubrimiento; el cliente debe probar los puertos configurados o utilizar el puerto anunciado por el mensaje inicial `welcome`.

### Dirección de conexión

Por defecto, el agente utiliza una de estas direcciones locales:

```text
ws://127.0.0.1:8765
ws://127.0.0.1:8766
ws://127.0.0.1:8767
ws://127.0.0.1:8768
ws://127.0.0.1:8769
ws://127.0.0.1:8770
```

Al establecer la conexión, envía un mensaje de bienvenida similar a:

```json
{
  "type": "welcome",
  "dispositivo_id": "<id-del-dispositivo>",
  "version": "1.0.0",
  "port": 8765,
  "auth_required": false,
  "modes": ["focus", "continuous"]
}
```

### Comandos disponibles

| Mensaje | Descripción |
|---|---|
| `{"type":"start_focus"}` | Inicia el modo de lectura asociado al enfoque del campo de entrada. |
| `{"type":"start_continuous"}` | Inicia lecturas continuas mientras la sesión permanezca activa. |
| `{"type":"stop_reading"}` | Detiene el ciclo de lectura. |
| `{"type":"status"}` | Solicita el estado actual del agente. |
| `{"type":"ping"}` | Comprueba la comunicación con el agente. |

También se aceptan alias en español como `iniciar_enfoque`, `iniciar_continuo`, `iniciar_lectura_permanente`, `detener_lectura` y `cerrar_enfoque`. El mensaje heredado `{"type":"leer"}` solicita una única lectura y termina después de retirar la tarjeta.

### Eventos de lectura

Los mensajes de estado pueden incluir eventos como los siguientes:

```json
{"type":"state","state":"waiting_card","mode":"focus"}
{"type":"state","state":"reading","mode":"focus"}
{"type":"uid","uid":"04A1B2C3","mode":"focus","reader":"Nombre del lector"}
{"type":"state","state":"card_present","mode":"focus"}
```

Los estados principales son `idle`, `waiting_card`, `reading` y `card_present`. El agente evita volver a publicar el mismo UID mientras la tarjeta continúe presente en el campo del lector; espera detectar su retirada antes de anunciar una nueva lectura.

### Autenticación del WebSocket

Si `NFC_AGENT_TOKEN` tiene un valor, el cliente debe enviar primero un mensaje de autenticación y esperar una respuesta positiva:

```json
{"type":"auth","token":"<token-configurado>"}
```

Guarda el token fuera del repositorio y configúralo de manera coherente entre el agente y el cliente. Un token incluido en código JavaScript del frontend puede ser inspeccionado por quien controle ese equipo; por eso, no sustituye un diseño de seguridad completo ni protege frente a usuarios locales con control de la máquina.

## Pruebas, compilación y herramientas de desarrollo

### Backend

Desde `backend/`:

```bash
npm run build
npm test
npm run test:watch
npm run lint
```

- `npm run build`: compila el código TypeScript.
- `npm test`: ejecuta Jest en modo no interactivo.
- `npm run test:watch`: ejecuta Jest en modo observación.
- `npm run lint`: comprueba los tipos con `tsc --noEmit`.

### Agente NFC

Desde `agente-nfc/`, con el entorno virtual activado:

```bash
python -m unittest discover -s tests -v
```

Las pruebas del agente cubren la máquina de estados mediante un lector simulado, por lo que no requieren hardware NFC conectado. Para validar la integración física, además de las pruebas automáticas, conecta un lector compatible y comprueba su detección mediante las herramientas PC/SC del sistema.

## Ejecución del agente en segundo plano

El repositorio incluye scripts y plantillas para iniciar el agente al iniciar sesión del usuario:

- **Windows:** `scripts/install_task_windows.ps1` registra una tarea programada para el usuario. Se puede retirar con `Unregister-ScheduledTask -TaskName "AgenteNFC" -Confirm:$false`.
- **Linux:** existe una plantilla `systemd` de usuario en `deploy/systemd/agente-nfc.service`. Debe actualizarse con la ruta absoluta real del proyecto antes de habilitarla.
- **macOS:** existe una plantilla `launchd` en `deploy/launchd/com.local.agente-nfc.plist`. Debe ajustarse con rutas absolutas antes de instalarla en `~/Library/LaunchAgents/`.

Consulta [`agente-nfc/README.md`](agente-nfc/README.md) para ver los comandos completos de instalación, administración y diagnóstico de cada sistema operativo.

## Seguridad y recomendaciones de despliegue

1. **Secreto JWT:** reemplaza el valor de ejemplo por una clave aleatoria de al menos 32 caracteres. No guardes secretos reales en Git.
2. **Bases de datos:** utiliza usuarios MySQL con los permisos mínimos necesarios y contraseñas distintas de las de ejemplo.
3. **Sincronización del esquema:** conserva `DB_SYNCHRONIZE=false` y `SIGEDIN_DB_SYNCHRONIZE=false` en entornos compartidos o de producción. Gestiona los cambios de esquema de manera controlada.
4. **Agente local:** conserva `NFC_AGENT_HOST=127.0.0.1` siempre que el diseño lo permita. No expongas los puertos WebSocket directamente a una red no confiable.
5. **Orígenes WebSocket:** limita `NFC_AGENT_ORIGINS` a los orígenes realmente utilizados por el cliente.
6. **Token del agente:** configura `NFC_AGENT_TOKEN` cuando corresponda y protege su valor. Recuerda que un secreto entregado al frontend local puede recuperarse desde el propio equipo.
7. **Tráfico de red:** protege la API y las comunicaciones entre componentes de acuerdo con el entorno de despliegue. Si se habilita acceso remoto al agente, evalúa por separado autenticación, firewall, TLS y controles de origen.
8. **Logs:** revisa los registros antes de compartirlos; evita publicar tokens, contraseñas, identificadores sensibles o datos personales.
9. **Pruebas de hardware:** valida el modelo del lector, sus drivers y el soporte del comando APDU requerido antes de operar con usuarios reales.

## Solución de problemas

| Problema | Qué revisar |
|---|---|
| El backend no inicia por conexión a MySQL | Comprueba que ambas bases existan, estén disponibles y tengan credenciales correctas. Verifica los valores `DB_*` y `SIGEDIN_DB_*`. |
| La API no aparece en el puerto esperado | Revisa `PORT` y `API_PREFIX` en `backend/.env`; la URL Swagger predeterminada es `http://localhost:3000/api/docs`. |
| Falla el inicio de sesión | Verifica `identifier`, contraseña, estado de la cuenta, rol y configuración de `JWT_SECRET`. Los estudiantes no pueden autenticarse. |
| El agente no detecta el lector | Comprueba el controlador, el servicio PC/SC y la detección del dispositivo con herramientas del sistema. En Linux, prueba `pcsc_scan`. |
| Se detecta el lector, pero no se obtiene el UID | Verifica que el modelo soporte el APDU `FF CA 00 00 00`; el soporte no es universal. |
| El frontend no puede conectar al agente | Comprueba que el agente esté activo, prueba los puertos `8765`–`8770` y añade el origen exacto a `NFC_AGENT_ORIGINS`. |
| El agente pide autenticación | Configura el mismo `NFC_AGENT_TOKEN` en el agente y en el cliente, y envía el mensaje `auth` antes de otros comandos. |
| No se publica otro UID mientras la tarjeta sigue sobre el lector | Es el comportamiento previsto para evitar lecturas duplicadas; retira la tarjeta y vuelve a acercarla. |
| Se requiere seleccionar un lector concreto | Configura `NFC_AGENT_READER_NAME` con el nombre exacto anunciado por PC/SC. |

## Licencias

Este repositorio contiene componentes con diferentes condiciones de licencia. El agente NFC incluye una licencia MIT, mientras que el backend se encuentra identificado como UNLICENSED.

La licencia del agente NFC no se extiende automáticamente al resto del proyecto. Antes de copiar, modificar, distribuir o reutilizar sus componentes, se deben verificar los permisos correspondientes y respetar las licencias de las dependencias de terceros.

La licencia general del proyecto está pendiente de definición por parte de sus responsables.

## Contribuciones

Las mejoras pueden organizarse en cambios pequeños y verificables:

1. Crea una rama específica para la corrección o funcionalidad.
2. Mantén separadas las modificaciones del backend y del agente cuando tengan responsabilidades distintas.
3. Ejecuta las pruebas y comprobaciones correspondientes antes de abrir un pull request.
4. Documenta cualquier nueva variable de entorno, endpoint, evento WebSocket o requisito de hardware.
5. No adjuntes credenciales, datos personales ni información sensible en commits, issues o logs.

## Repositorio

<p align="center">
  <a href="https://github.com/AeroPass/AeroPass-NFC">Código fuente</a> ·
  <a href="https://github.com/AeroPass/AeroPass-NFC/issues">Issues</a> ·
  <a href="https://github.com/AeroPass/AeroPass-NFC/commits/main/">Historial de cambios</a>
</p>

<p align="center">
  <sub>AeroPass NFC — API de gestión de acceso y agente local de lectura NFC.</sub>
</p>
