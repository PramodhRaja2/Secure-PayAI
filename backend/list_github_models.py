import os
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path)

def list_models():
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("GITHUB_TOKEN not found in .env")
        return

    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        # Standard OpenAI models endpoint often used by these proxies
        response = requests.get("https://models.inference.ai.azure.com/models", headers=headers)
        if response.status_code == 200:
            models = response.json()
            print("Available Models:")
            for m in models:
                if isinstance(m, dict) and 'id' in m:
                    print(f"- {m['id']}")
                else:
                    print(f"- {m}")
        else:
            print(f"Error listing models: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    list_models()
