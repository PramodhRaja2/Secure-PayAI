import os
from dotenv import load_dotenv, find_dotenv

print("--- NEURAL CORE DIAGNOSTIC ---")
dotenv_path = find_dotenv()
print(f"Path: {dotenv_path}")

load_dotenv(dotenv_path, override=True)

keys = ["GEMINI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"]
for k in keys:
    val = os.getenv(k)
    if val:
        print(f" {k}: [LOADED] {val[:10]}...{val[-5:]}")
    else:
        print(f" {k}: [MISSING]")

print("--- END ---")
