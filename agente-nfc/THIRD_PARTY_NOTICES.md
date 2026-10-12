# Avisos de dependencias de terceros

| Dependencia | Versión fijada | Licencia | Uso |
|---|---:|---|---|
| `websockets` | `16.1.1` | BSD-3-Clause | Servidor asíncrono WebSocket |
| `setuptools` | `84.0.0` | MIT | Backend de construcción del paquete (`pyproject.toml`) |
| Python standard library (`asyncio`, `ctypes`, `json`, `logging`, etc.) | Python 3.10+ | Licencia de Python | Concurrencia, API PC/SC nativa, configuración y logs |

El adaptador PC/SC no importa PySCard, `pyscard`, `nfcpy` ni otra biblioteca NFC de terceros. Usa las APIs nativas WinSCard, pcsc-lite o PCSC.framework, que deben estar instaladas en el sistema operativo.

Antes de publicar un instalador binario, vuelve a verificar los metadatos de licencia de las versiones exactas utilizadas. La licencia del paquete no sustituye las licencias del sistema operativo, drivers ni firmware del lector.

## Componentes PC/SC suministrados por el sistema operativo

Estos componentes **no están incluidos ni redistribuidos** por este ZIP; el adaptador los carga de forma dinámica a través de `ctypes`:

- **Windows:** `winscard.dll`, API de Windows.
- **macOS:** `PCSC.framework`, framework del sistema.
- **Linux:** biblioteca cliente `libpcsclite.so.1` y un servicio PC/SC compatible proporcionado por la distribución.

La API cliente de pcsc-lite contiene código bajo BSD-3-Clause, pero el proyecto pcsc-lite y los paquetes de algunas distribuciones pueden incluir herramientas/componentes adicionales con licencias distintas, incluida GPL-3.0-or-later. Para cumplir una política estricta de no copyleft, audita los paquetes concretos instalados en cada imagen Linux y confirma que el cliente y el servicio PC/SC elegidos cumplen tu política; este repositorio no redistribuye dichos componentes. Referencias de licencia: [código/licencia BSD-3-Clause de pcsc-lite](https://pcsclite.apdu.fr/api/src_2PCSC_2pcsclite_8h_source.html) y [metadatos de empaquetado con componentes BSD/GPL](https://layers.openembedded.org/layerindex/recipe/1079/).
