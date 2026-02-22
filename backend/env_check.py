import os
from dotenv import load_dotenv, find_dotenv

print("--- DIAGNOSTIC START ---")
dotenv_path = find_dotenv()
print(f"Dotenv Path: {dotenv_path}")

if dotenv_path:
    # Read raw content
    with open(dotenv_path, 'r') as f:
        content = f.read()
        print(f"Raw .env content (first 50 chars): {repr(content[:50])}")
        
    loaded = load_dotenv(dotenv_path, override=True)
    print(f"load_dotenv() returned: {loaded}")
else:
    print("find_dotenv() failed to find any .env file.")

key = os.getenv("GEMINI_API_KEY")
if key:
    print(f"SUCCESS: GEMINI_API_KEY found: {key[:10]}...")
else:
    print("FAILURE: GEMINI_API_KEY NOT found in environment.")

print("Current Environment Variables (first 5):")
for k in list(os.environ.keys())[:5]:
    print(f" - {k}")

print("--- DIAGNOSTIC END ---")
