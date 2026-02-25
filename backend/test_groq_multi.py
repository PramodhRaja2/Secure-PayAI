from groq import Groq
import os
from dotenv import load_dotenv, find_dotenv

def test_groq_multi():
    print("--- GROQ MULTI-NEURAL HANDSHAKE START ---")
    load_dotenv(find_dotenv(), override=True)
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print(">> GROQ_API_KEY MISSING")
        return

    client = Groq(api_key=api_key)
    
    models = [
        {
            "id": "openai/gpt-oss-120b",
            "params": {
                "temperature": 1,
                "max_completion_tokens": 256,
                "top_p": 1,
                "reasoning_effort": "medium"
            }
        },
        {
            "id": "qwen/qwen3-32b",
            "params": {
                "temperature": 0.6,
                "max_completion_tokens": 256,
                "top_p": 0.95,
                "reasoning_effort": "default"
            }
        }
    ]

    for m in models:
        print(f"\n>> Testing Model: {m['id']}")
        try:
            completion = client.chat.completions.create(
                model=m['id'],
                messages=[{"role": "user", "content": "Briefly state your primary capability."}],
                stream=False,
                **m['params']
            )
            print(f">> SUCCESS: {completion.choices[0].message.content[:100]}...")
        except Exception as e:
            print(f">> FAIL: {e}")

    print("\n--- GROQ MULTI-NEURAL HANDSHAKE END ---")

if __name__ == "__main__":
    test_groq_multi()
