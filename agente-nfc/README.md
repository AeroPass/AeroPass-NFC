# inicializador
venv\Scripts\activate
venv\Scripts\python.exe -m nfc_agent


# Agente NFC multiplataforma

Agente local en Python 3.10+ que mantiene un proceso vivo, recibe comandos por WebSocket, consulta un lector NFC mediante PC/SC y envía el UID al frontend sin bloquear el event loop.

## Qué contiene

- `nfc_agent/domain`: estados, modos y contratos del lector.
- `nfc_agent/application`: ciclo de vida de lectura, deduplicación hasta la retirada y control de concurrencia.
- `nfc_agent/hardware`: adaptador PC/SC basado en las APIs nativas de Windows, Linux y macOS, invocadas con `ctypes`.
- `nfc_agent/transport`: servidor WebSocket y protocolo de mensajes.
- `nfc_agent/config.py`: configuración por `.env` o variables de entorno.
- `tests/`: pruebas de la máquina de estados con lector simulado; no requieren NFC físico.
- `deploy/` y `scripts/`: plantillas y comandos de ejecución en segundo plano.

El paquete no incluye el `venv` del proyecto anterior, certificados autofirmados ni la clave privada incluida en el ZIP de referencia.

## Licencias y dependencias

La única dependencia Python externa de ejecución se fija en `websockets==16.1.1`, con licencia BSD-3-Clause y soporte de Python 3.10. `websockets` 17.x requiere Python 3.11 o posterior, por eso no se usa en una solución cuyo mínimo debe ser 3.10. El acceso al lector no requiere PySCard ni una dependencia Python NFC: se utiliza la API nativa PC/SC que proporciona el sistema.

La licencia del agente es MIT. Consulta `THIRD_PARTY_NOTICES.md`. La versión de Python y las dependencias exactas deben mantenerse bloqueadas en despliegues reproducibles.

**Nota sobre licencias del sistema:** el ZIP no incorpora componentes PC/SC nativos. En Linux, `libpcsclite` y el servicio de tarjetas son proporcionados por la distribución y sus paquetes pueden tener composiciones/licencias distintas. Si la política de despliegue prohíbe cualquier componente copyleft, audita los paquetes PC/SC concretos antes de instalar; el cumplimiento de las dependencias Python por sí solo no sustituye esa verificación.

## Requisitos previos

- Python 3.10 o superior.
- Un lector NFC compatible con PC/SC y sus drivers.
- Servicio/middleware PC/SC activo: WinSCard en Windows, `pcsc-lite` en Linux o `PCSC.framework` en macOS.
- El UID debe estar disponible mediante el APDU `FF CA 00 00 00` (heredado del agente original). Algunos lectores no lo soportan; se debe validar el modelo real antes de producción.

### Linux

En Debian/Ubuntu, un punto de partida habitual es instalar `pcscd` y las herramientas del ecosistema PC/SC desde los repositorios de la distribución, y habilitar/iniciar el servicio según la distribución. Los nombres de paquetes y comandos varían por distro. Verifica primero:

```bash
pcsc_scan
```

Si `pcsc_scan` no existe, instala el paquete de herramientas PC/SC de tu distribución. Los permisos del usuario deben permitir el acceso al servicio/dispositivo.

### Windows

Instala el controlador del fabricante y comprueba que el servicio **Smart Card** esté iniciado. El adaptador usa `winscard.dll` del sistema, no necesita una DLL de terceros dentro del proyecto.

### macOS

Instala el driver/middleware PC/SC del lector si el fabricante lo requiere. El adaptador intenta cargar `/System/Library/Frameworks/PCSC.framework/PCSC`.

## Instalación y configuración

Desde la carpeta raíz del proyecto:

### Windows (PowerShell)

```powershell
py -3 --version
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m unittest discover -s tests -v
python -m nfc_agent
```

Si la política de PowerShell impide activar el entorno, puedes invocar directamente `\.venv\Scripts\python.exe -m pip ...` y `\.venv\Scripts\python.exe -m nfc_agent`.

### Linux

```bash
python3 --version
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python -m unittest discover -s tests -v
python -m nfc_agent
```

### macOS

```bash
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python -m unittest discover -s tests -v
python -m nfc_agent
```

Si tienes varios lectores PC/SC, configura `NFC_AGENT_READER_NAME` con el nombre exacto. Si lo dejas vacío, se utiliza el primer lector enumerado. Puedes encontrar el nombre con las herramientas PC/SC del sistema.

## Configuración

Las variables de entorno del sistema tienen prioridad sobre el archivo `.env`. Las opciones son:

| Variable | Valor predeterminado | Descripción |
|---|---|---|
| `NFC_AGENT_HOST` | `127.0.0.1` | Dirección de escucha. Se restringe a loopback salvo que se habilite explícitamente el bind remoto. |
| `NFC_AGENT_PORTS` | `8765,8766,8767,8768,8769,8770` | Puertos probados en orden; se usa el primero libre. |
| `NFC_AGENT_ORIGINS` | localhost/127.0.0.1 en puertos 5500 y 3000 | Orígenes web permitidos. Separa varios con coma. |
| `NFC_AGENT_TOKEN` | vacío | Si se define, el frontend debe autenticarse antes de emitir comandos. |
| `NFC_AGENT_POLL_INTERVAL` | `0.35` | Intervalo de sondeo, en segundos; rango 0.05 a 10. |
| `NFC_AGENT_READER_NAME` | vacío | Nombre PC/SC exacto del lector que se desea usar. |
| `NFC_AGENT_DATA_DIR` | directorio de datos por sistema | Carpeta donde se guardan el ID persistente y los logs. |

Por seguridad, el agente escucha solo en loopback. No lo expongas directamente a otras máquinas. Para permitir un bind no local se requiere `NFC_AGENT_ALLOW_REMOTE_BIND=1`, además de evaluar autenticación, firewall, orígenes y TLS por separado.

Los logs rotan en `agente-nfc.log` (5 MiB, tres copias). El ID del dispositivo se conserva en `device_id.txt` dentro del directorio de datos del usuario.

## Protocolo WebSocket

URL predeterminadas: `ws://127.0.0.1:8765` hasta `ws://127.0.0.1:8770`. El servidor prueba esos puertos y anuncia el utilizado en el mensaje `welcome`; si la aplicación frontend prueba varios puertos, puede conservar ese mecanismo. No hay un endpoint HTTP de descubrimiento.

Al conectarse, el agente envía:

```json
{"type":"welcome","dispositivo_id":"...","version":"1.0.0","port":8765,"auth_required":false,"modes":["focus","continuous"]}
```

Comandos del frontend:

```json
{"type":"start_focus"}
{"type":"start_continuous"}
{"type":"stop_reading"}
{"type":"status"}
{"type":"ping"}
```

También se aceptan aliases en español: `iniciar_enfoque`, `iniciar_continuo`, `iniciar_lectura_permanente`, `detener_lectura`, `cerrar_enfoque`. El mensaje heredado `{"type":"leer"}` conserva una lectura única: espera un UID y termina después de retirar la tarjeta.

Al detectar una tarjeta se envían eventos similares a:

```json
{"type":"state","state":"waiting_card","mode":"focus"}
{"type":"state","state":"reading","mode":"focus"}
{"type":"uid","uid":"04A1B2C3","mode":"focus","reader":"Nombre del lector"}
{"type":"state","state":"card_present","mode":"focus"}
```

Los estados son `idle`, `waiting_card`, `reading` y `card_present`. El agente no publica otro UID hasta detectar que la tarjeta dejó el campo de lectura. En `focus` continúa esperando mientras el input siga enfocado; en `continuous` continúa hasta que la sección se cierre. Ambos modos se detienen con `stop_reading` o cuando se desconecta la conexión propietaria.

Si `NFC_AGENT_TOKEN` tiene valor, el frontend debe enviar primero `{"type":"auth","token":"EL_MISMO_TOKEN"}` y esperar `auth_result` con `ok: true`. Guarda el token fuera del repositorio. Recuerda que un secreto incrustado en JavaScript del frontend local es visible para el usuario que controla ese equipo; el token ayuda a evitar conexiones accidentales, no es una frontera de seguridad frente a usuarios locales con control de la máquina.

El navegador debe abrir el WebSocket desde un origen incluido en `NFC_AGENT_ORIGINS`. Para otro puerto del frontend, actualiza la lista antes de ejecutar el agente.

## Ejecución en segundo plano

### Windows: tarea programada del usuario

Desde PowerShell con el directorio del proyecto como directorio actual:

```powershell
.\scripts\install_task_windows.ps1
```

Esto registra una tarea que se ejecuta al iniciar sesión con `pythonw.exe` del entorno `.venv` y deja logs en el directorio de datos. Es una tarea de segundo plano de usuario, no un servicio nativo de Windows Session 0; es apropiada para lectores NFC que necesitan el contexto interactivo del usuario. Para desinstalar:

```powershell
Unregister-ScheduledTask -TaskName "AgenteNFC" -Confirm:$false
```

### Linux: systemd de usuario

Edita `deploy/systemd/agente-nfc.service` y reemplaza `/RUTA/ABSOLUTA/AL/PROYECTO` por la ruta real. Luego:

```bash
systemctl --user daemon-reload
systemctl --user enable --now agente-nfc.service
systemctl --user status agente-nfc.service
journalctl --user -u agente-nfc.service -f
```

Si debe iniciarse aunque el usuario no haya iniciado sesión, habilita lingering conscientemente con `loginctl enable-linger "$USER"` y comprueba que el servicio PC/SC pueda ser utilizado en ese contexto.

### macOS: launchd del usuario

Edita `deploy/launchd/com.local.agente-nfc.plist`, reemplaza cada ruta `/RUTA/ABSOLUTA/AL/PROYECTO` por una ruta absoluta real y copia el plist a `~/Library/LaunchAgents/`. Después:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.local.agente-nfc.plist
launchctl print gui/$(id -u)/com.local.agente-nfc
```

Para detener y retirar el agente:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.local.agente-nfc.plist
```

## Arquitectura SOLID

- **SRP:** el transporte, el controlador de estados, el adaptador PC/SC, la configuración, el ID persistente y el logging son módulos separados.
- **OCP:** `AgentController` depende del contrato `NfcReader`; un adaptador adicional puede implementar `poll()` y `close()` sin reescribir el controlador.
- **LSP:** cualquier implementación que cumpla el contrato puede sustituir al adaptador PC/SC.
- **ISP:** el puerto de hardware contiene únicamente operaciones usadas por el controlador.
- **DIP:** las reglas de lectura dependen del protocolo abstracto `NfcReader`, no de ctypes o de WinSCard.

## Pruebas y criterios antes de producción

Las pruebas automáticas cubren los modos, la deduplicación durante la presencia de una tarjeta, el control de sesión propietaria y el parseo del protocolo. Ejecuta:

```bash
python -m unittest discover -s tests -v
```

La prueba automatizada no certifica el lector físico. Antes de un despliegue real, valida en Windows, Linux y macOS los siguientes puntos: (1) driver y servicio PC/SC, (2) lectura APDU del UID de los tipos de tarjeta soportados, (3) retirada y reentrada, (4) desconexión/reconexión del lector, (5) permisos del usuario del servicio, y (6) puerto/origen real del frontend. Algunos lectores CCID exponen diferente APDU o comportamientos de conexión; esos casos requieren ajustar solo el adaptador de hardware.
