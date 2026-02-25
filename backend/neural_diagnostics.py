import os
import openai
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path)

def test_model(model_id):
    token = os.getenv("GITHUB_TOKEN")
    client = openai.OpenAI(
        base_url="https://models.inference.ai.azure.com",
        api_key=token
    )
    
    print(f"--- Testing Model: {model_id} ---")
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say hello."}],
            model=model_id,
            max_tokens=10
        )
        print(f"SUCCESS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"ERROR: {e}")

def list_all():
    token = os.getenv("GITHUB_TOKEN")
    import requests
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get("https://models.inference.ai.azure.com/models", headers=headers)
    if r.status_code == 200:
        with open("backend/full_model_data.json", "w") as f:
            f.write(json.dumps(r.json(), indent=2))
        print("Model list saved to backend/full_model_data.json")
    else:
        print(f"List failed: {r.status_code}")

if __name__ == "__main__":
    import json
    # test_model("gpt-5")
    # test_model("o1-preview")
    # test_model("gpt-4o")
    list_all()
