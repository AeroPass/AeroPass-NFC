import time

from smartcard.System import readers
from smartcard.util import toHexString


class NFCReader:

    def __init__(self):
        self.lector = None

    def detectar_lectores(self):
        try:
            return readers()

        except Exception as error:
            print(
                f"❌ Error detectando lectores: {error}"
            )
            return []

    def seleccionar_lector(self, indice=0):
        lectores = self.detectar_lectores()

        if not lectores:
            self.lector = None
            return False

        if indice < 0 or indice >= len(lectores):
            self.lector = None
            return False

        self.lector = lectores[indice]

        print(
            f"✓ Lector seleccionado: {self.lector}"
        )

        return True

    def esperar_lector(self, intervalo=2):

        while self.lector is None:

            lectores = self.detectar_lectores()

            if lectores:

                self.lector = lectores[0]

                print()
                print(
                    f"✓ Lector NFC detectado: {self.lector}"
                )
                print()

                return True

            print(
                "⚠️ No hay lector NFC conectado. "
                "Esperando..."
            )

            time.sleep(intervalo)

        return True

    def conectar_tarjeta(self):

        if self.lector is None:
            return None

        conexion = self.lector.createConnection()

        try:
            conexion.connect()
            return conexion

        except Exception:
            return None

    def leer_uid(self, conexion):

        comando = [
            0xFF,
            0xCA,
            0x00,
            0x00,
            0x00
        ]

        respuesta, sw1, sw2 = conexion.transmit(
            comando
        )

        if sw1 == 0x90 and sw2 == 0x00:

            uid = toHexString(respuesta)

            uid = uid.replace(" ", "")

            return uid.upper()

        raise RuntimeError(
            f"No se pudo obtener el UID. "
            f"Respuesta: {sw1:02X} {sw2:02X}"
        )

    def esperar_tarjeta(self, intervalo=0.5):

        while True:

            if not self.lector_conectado():

                self.lector = None

                return None

            conexion = self.conectar_tarjeta()

            if conexion is not None:

                return conexion

            time.sleep(intervalo)

    def esperar_retiro(self, intervalo=0.5):

        while True:

            if not self.lector_conectado():

                self.lector = None

                return False

            conexion = self.conectar_tarjeta()

            if conexion is None:

                return True

            time.sleep(intervalo)

    def lector_conectado(self):

        lectores = self.detectar_lectores()

        if not lectores:
            return False

        if self.lector is None:
            return False

        return any(
            str(lector) == str(self.lector)
            for lector in lectores
        )