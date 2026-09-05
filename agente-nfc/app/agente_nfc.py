import asyncio
import json
import ssl
import uuid
import logging
import signal
import sys
from pathlib import Path
from datetime import datetime, timedelta
import ipaddress

try:
    import websockets
except ImportError:
    print("Instala websockets: pip install websockets")
    sys.exit(1)

# Importa tu NFCReader (ajusta según donde esté)
from nfc_reader import NFCReader

# Configuración de puertos a probar
PUERTOS = [8765, 8766, 8767, 8768, 8769, 8770]
CERT_DIR = Path(__file__).parent / "certs"
CERT_FILE = CERT_DIR / "cert.pem"
KEY_FILE = CERT_DIR / "key.pem"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AgenteNFC")


class AgenteNFC:
    def __init__(self):
        self.dispositivo_id = self._generar_id_dispositivo()
        self.nfc = NFCReader()
        self.server = None
        self.puerto = None

    def _generar_id_dispositivo(self) -> str:
        """Genera un identificador único persistente para este dispositivo."""
        id_file = Path(__file__).parent / "dispositivo_id.txt"
        if id_file.exists():
            with open(id_file, "r") as f:
                return f.read().strip()
        nuevo_id = str(uuid.uuid4())
        with open(id_file, "w") as f:
            f.write(nuevo_id)
        return nuevo_id

    # Esta función ahora recibe solo 'websocket' (sin 'path')
    async def manejar_cliente(self, websocket):
        """Maneja la comunicación con un cliente (el frontend)."""
        # Enviar el dispositivo_id al conectar
        await websocket.send(json.dumps({"type": "welcome", "dispositivo_id": self.dispositivo_id}))
        logger.info("Cliente conectado. Enviado dispositivo_id: %s", self.dispositivo_id)

        try:
            async for mensaje in websocket:
                data = json.loads(mensaje)
                if data.get("type") == "leer":
                    logger.info("Solicitud de lectura recibida. Leyendo tarjeta...")

                    # Verificar que hay lectores NFC conectados
                    lectores = self.nfc.detectar_lectores()
                    if not lectores:
                        await websocket.send(json.dumps({"type": "error", "error": "No se detectó lector NFC conectado"}))
                        logger.error("No se detectó lector NFC")
                        continue

                    # Si no hay un lector seleccionado, seleccionar el primero
                    if self.nfc.lector is None:
                        self.nfc.seleccionar_lector()
                        logger.info("Lector seleccionado automáticamente: %s", self.nfc.lector)

                    # Esperar a que una tarjeta se acerque (bloquea hasta que ocurra o hasta que se desconecte el lector)
                    conexion = self.nfc.esperar_tarjeta()
                    if conexion is None:
                        await websocket.send(json.dumps({"type": "error", "error": "No se pudo conectar al lector NFC"}))
                        continue

                    # Leer el UID de la tarjeta
                    uid = self.nfc.leer_uid(conexion)
                    await websocket.send(json.dumps({"type": "uid", "uid": uid}))
                    logger.info("UID leído: %s", uid)
                else:
                    await websocket.send(json.dumps({"type": "error", "error": "Tipo de mensaje desconocido"}))
        except websockets.ConnectionClosed:
            logger.info("Cliente desconectado")
        except Exception as e:
            logger.error("Error en manejo de cliente: %s", e)

    async def iniciar(self):
        """Inicia el servidor WebSocket en el primer puerto libre."""
        # (Opcional) Si quieres usar SSL, descomenta estas líneas y usa 'ssl=ssl_context' abajo
        # ssl_context = self._obtener_certificados()

        for puerto in PUERTOS:
            try:
                self.server = await websockets.serve(
                    self.manejar_cliente,
                    "localhost",
                    puerto,
                    # ssl=ssl_context  # ← Descomenta si usas SSL
                )
                self.puerto = puerto
                logger.info("Servidor WebSocket iniciado en ws://localhost:%s", puerto)
                break
            except OSError as e:
                logger.warning("Puerto %s ocupado, intentando siguiente... (%s)", puerto, e)
        if self.server is None:
            logger.error("No se pudo iniciar en ningún puerto libre")
            sys.exit(1)

        try:
            async with self.server:
                await asyncio.Future()  # espera para siempre
        except KeyboardInterrupt:
            logger.info("Deteniendo servidor...")
        finally:
            self.server.close()
            await self.server.wait_closed()

    # (Opcional) Función para generar certificados (solo si usas SSL)
    def _obtener_certificados(self):
        """Genera certificados autofirmados si no existen usando cryptography."""
        if not CERT_DIR.exists():
            CERT_DIR.mkdir(parents=True)
        if not CERT_FILE.exists() or not KEY_FILE.exists():
            logger.info("Generando certificados autofirmados...")
            from cryptography import x509
            from cryptography.x509.oid import NameOID
            from cryptography.hazmat.primitives import hashes, serialization
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives.serialization import Encoding, PrivateFormat, NoEncryption

            private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "localhost")])
            cert = (
                x509.CertificateBuilder()
                .subject_name(subject)
                .issuer_name(issuer)
                .public_key(private_key.public_key())
                .serial_number(x509.random_serial_number())
                .not_valid_before(datetime.utcnow())
                .not_valid_after(datetime.utcnow() + timedelta(days=365))
                .add_extension(
                    x509.SubjectAlternativeName([x509.DNSName("localhost"), x509.IPAddress(ipaddress.ip_address("127.0.0.1"))]),
                    critical=False,
                )
                .sign(private_key, hashes.SHA256())
            )
            with open(KEY_FILE, "wb") as f:
                f.write(private_key.private_bytes(encoding=Encoding.PEM, format=PrivateFormat.TraditionalOpenSSL, encryption_algorithm=NoEncryption()))
            with open(CERT_FILE, "wb") as f:
                f.write(cert.public_bytes(Encoding.PEM))
            logger.info("Certificados generados en %s", CERT_DIR)
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(certfile=str(CERT_FILE), keyfile=str(KEY_FILE))
        return ssl_context


def main():
    signal.signal(signal.SIGINT, lambda s, f: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))

    agente = AgenteNFC()
    try:
        asyncio.run(agente.iniciar())
    except Exception as e:
        logger.error("Error fatal: %s", e)
        sys.exit(1)


if __name__ == "__main__":
    main()