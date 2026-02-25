import os
import openai
import anthropic
import traceback
from dotenv import load_dotenv, find_dotenv

def test_ai():
    print("--- NEURAL DIAGNOSTICS START ---")
    
    # Reload env
    dotenv_path = find_dotenv()
    print(f"Loading environment from: {dotenv_path}")
    load_dotenv(dotenv_path, override=True)
    
    print("\n[STEP 1] Testing Anthropic (Claude)...")
    ant_key = os.getenv("ANTHROPIC_API_KEY")
    if not ant_key:
        print(">> ANTHROPIC_API_KEY MISSING")
    else:
        print(f">> Key found (starts with: {ant_key[:10]}...)")
        try:
            client = anthropic.Anthropic(api_key=ant_key)
            message = client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=5,
                messages=[{"role": "user", "content": "Hi"}]
            )
            print(">> Anthropic SUCCESS")
            print(f">> Sample: {message.content[0].text}")
        except Exception as e:
            print(f">> Anthropic FAIL (Standard): {e}")
            # print(traceback.format_exc())

    print("\n[STEP 2] Testing OpenAI (GPT-4o)...")
    oai_key = os.getenv("OPENAI_API_KEY")
    if not oai_key:
        print(">> OPENAI_API_KEY MISSING")
    else:
        print(f">> Key found (starts with: {oai_key[:10]}...)")
        try:
            client = openai.OpenAI(api_key=oai_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5
            )
            print(">> OpenAI SUCCESS")
            print(f">> Sample: {response.choices[0].message.content}")
        except Exception as e:
            print(f">> OpenAI FAIL: {e}")

    print("\n--- NEURAL DIAGNOSTICS END ---")

if __name__ == "__main__":
    test_ai()
