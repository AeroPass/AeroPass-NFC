import requests

from app.api_client import ApiClient


def main():

    uid = "0463576A330289"

    print("=" * 50)
    print("       PRUEBA API - REGISTRAR TARJETA")
    print("=" * 50)
    print()

    print(f"UID de prueba: {uid}")
    print()

    cliente = ApiClient()

    print("Enviando tarjeta al backend...")

    response = cliente.enviar_uid(uid)

    print()

    if response is None:
        print("No se recibió respuesta del backend.")
        return

    print(f"HTTP Status: {response.status_code}")
    print(f"Respuesta: {response.text}")


if __name__ == "__main__":
    main()