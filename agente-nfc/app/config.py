import os
from dotenv import load_dotenv
load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL")
API_TIMEOUT = float(os.getenv("API_TIMEOUT"))