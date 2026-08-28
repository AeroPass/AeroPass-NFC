import requests
from app.config import API_BASE_URL, API_TIMEOUT

class ApiClient:

    def __init__(self):
        self.base_url = API_BASE_URL
        self.timeout = API_TIMEOUT

    def enviar_uid(self, uid):
        url = f"{self.base_url}/tarjetas"

        payload = {"uid": uid}
        try:
            response = requests.post(
                url,
                json=payload,
                timeout=self.timeout
            )
            return response
        
        except requests.exceptions.ConnectionError:
            print("No se pudo conectar con el backend.")
            return None

        except requests.exceptions.Timeout:
            print("El backend tardó demasiado en responder.")
            return None

        except requests.exceptions.RequestException as error:
            print(f"Error de comunicación con el backend: {error}")
            return None