"""
Interactive API Key Setup
Run this to create your .env file with API key
"""

import os

def setup_api_key():
    print("=" * 60)
    print("API KEY SETUP")
    print("=" * 60)

    print("\nYou need an Anthropic API key to use this app.")
    print("\nTo get your API key:")
    print("1. Go to: https://console.anthropic.com/")
    print("2. Sign in (or create account)")
    print("3. Click 'API Keys' in left sidebar")
    print("4. Click 'Create Key'")
    print("5. Copy the key (starts with 'sk-ant-...')")

    print("\n" + "=" * 60)

    # Check if .env already exists
    if os.path.exists('.env'):
        print("\n[WARNING] .env file already exists!")
        overwrite = input("Overwrite existing .env file? (yes/no): ").strip().lower()
        if overwrite not in ['yes', 'y']:
            print("[CANCELLED] Keeping existing .env file")
            return

    print("\nPaste your Anthropic API key below:")
    print("(The key will be hidden for security)")

    api_key = input("API Key: ").strip()

    if not api_key:
        print("\n[ERROR] No API key entered. Exiting.")
        return

    if not api_key.startswith('sk-ant-'):
        print("\n[WARNING] API key doesn't start with 'sk-ant-'")
        confirm = input("Continue anyway? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y']:
            print("[CANCELLED] Setup cancelled")
            return

    # Create .env file
    env_content = f"""# Anthropic API Key
ANTHROPIC_API_KEY={api_key}

# Optional: OpenAI API Key (if you want to use GPT instead)
OPENAI_API_KEY=

# Application Settings
EMBEDDING_PROVIDER=huggingface
LLM_PROVIDER=anthropic
VECTOR_STORE_PATH=./chroma_db
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
"""

    with open('.env', 'w', encoding='utf-8') as f:
        f.write(env_content)

    print("\n[SUCCESS] .env file created!")
    print("\nYour configuration:")
    print(f"  - API Key: {api_key[:20]}...{api_key[-4:]}")
    print(f"  - Provider: Anthropic Claude")
    print(f"  - Embeddings: HuggingFace (free, local)")

    # Test the API key
    print("\n[TEST] Testing API key...")
    try:
        import anthropic
        from dotenv import load_dotenv

        load_dotenv()

        client = anthropic.Anthropic(api_key=api_key)

        # Try a minimal API call
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=10,
            messages=[{"role": "user", "content": "Hi"}]
        )

        print("[OK] API key is valid!")
        print("\nNext steps:")
        print("1. Build vector database: python build_database.py")
        print("2. Run tests: python quick_test.py")

    except Exception as e:
        print(f"\n[ERROR] API key test failed: {e}")
        print("\nPossible issues:")
        print("- Invalid API key")
        print("- No credits in account")
        print("- Network connection issue")
        print("\nYou can still proceed, but testing will fail until this is resolved.")

if __name__ == "__main__":
    try:
        setup_api_key()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Setup cancelled by user")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
