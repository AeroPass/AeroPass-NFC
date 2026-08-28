import time
from app.nfc_reader import NFCReader

def ejecutar_agente():

    print("=" * 50)
    print("              AGENTE NFC")
    print("=" * 50)
    print()

    lector_nfc = NFCReader()

    try:
        print("Buscando lector NFC...")
        lector_nfc.esperar_lector()
        print("Agente iniciado correctamente.")
        print("Esperando tarjetas...")
        print()

        while True:
            lectores = lector_nfc.detectar_lectores()
            if not lectores:
                print()
                print("Lector NFC desconectado.")
                print("Esperando reconexión...")
                print()
                lector_nfc.lector = None
                lector_nfc.esperar_lector()

                print("Lector reconectado.")
                print("Esperando tarjetas...")
                print()
                continue

            conexion = lector_nfc.esperar_tarjeta()
            if conexion is None:
                print()
                print("Lector NFC desconectado.")
                print("Esperando reconexión...")
                print()

                lector_nfc.lector = None

                lector_nfc.esperar_lector()

                print("Lector reconectado.")
                print("Esperando tarjetas...")
                print()

                continue

            try:

                uid = lector_nfc.leer_uid(conexion)
                print()
                print("TARJETA DETECTADA")
                print(f"UID: {uid}")
                print()

            except Exception as error:

                print()
                print(f"Error leyendo tarjeta: {error}")
                print()

            print("Esperando retiro de la tarjeta...")
            
            tarjeta_retirada = lector_nfc.esperar_retiro()
            
            if not tarjeta_retirada:
            
                print()
                print("Lector NFC desconectado.")
                print("Esperando reconexión...")
                print()
            
                lector_nfc.lector = None
            
                lector_nfc.esperar_lector()
            
                print("Lector reconectado.")
                print("Esperando tarjetas...")
                print()
            
                continue
            
            print("Tarjeta retirada.")
            print()
            print("Esperando nueva tarjeta...")
            print()
            time.sleep(0.5)

    except KeyboardInterrupt:
        print()
        print("Agente detenido por el usuario.")
    except Exception as error:
        print()
        print(f"Error crítico: {error}")



if __name__ == "__main__":
    ejecutar_agente()