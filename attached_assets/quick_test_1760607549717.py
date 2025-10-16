"""
Quick Test Script for Dream Interpreter RAG System
Tests the system with sample dreams without requiring full database setup
"""

import os
import sys

# Sample test dreams
TEST_DREAMS = [
    {
        "id": "test_1",
        "name": "Flying Dream",
        "dream": "I was flying over my childhood home. The sky was bright blue and I felt incredibly free and happy. I could control my direction by thinking about where I wanted to go.",
        "context": {"age": 28, "gender": "female", "recent_life_events": "Recently got promoted at work"}
    },
    {
        "id": "test_2",
        "name": "Chase Dream",
        "dream": "I was being chased through a dark forest by something I couldn't see. I kept running but my legs felt heavy. I tried to scream but no sound came out.",
        "context": {"age": 35, "gender": "male", "recent_life_events": "Facing deadline pressures at work"}
    },
    {
        "id": "test_3",
        "name": "Teeth Falling Dream",
        "dream": "I was looking in the mirror and noticed one of my teeth was loose. When I touched it, it fell out. Then more teeth started falling out one by one.",
        "context": {"age": 42, "gender": "female", "recent_life_events": "Going through divorce"}
    }
]

def check_environment():
    """Check if environment is set up correctly"""
    print("=" * 60)
    print("DREAM INTERPRETER - SYSTEM CHECK")
    print("=" * 60)

    issues = []

    # Check for .env file
    if not os.path.exists('.env'):
        issues.append("[X] .env file not found")
        print("\n[WARNING] .env file not found")
        print("   Please create .env file with your API keys")
        print("   Copy .env.example to .env and add your keys:")
        print("   - ANTHROPIC_API_KEY (or OPENAI_API_KEY)")
    else:
        print("\n[OK] .env file found")

    # Check for vector database
    if not os.path.exists('chroma_db'):
        issues.append("[X] Vector database not built")
        print("\n[WARNING] Vector database (chroma_db) not found")
        print("   Run: python -c 'from document_processor import *; build_vector_db()'")
    else:
        print("\n[OK] Vector database found")

    # Check for required Python packages
    try:
        import anthropic
        print("[OK] anthropic package installed")
    except ImportError:
        issues.append("[X] anthropic package not installed")
        print("\n[WARNING] anthropic package not installed")
        print("   Run: pip install anthropic")

    try:
        import chromadb
        print("[OK] chromadb package installed")
    except ImportError:
        issues.append("[X] chromadb package not installed")
        print("   Run: pip install chromadb")

    try:
        import langchain
        print("[OK] langchain package installed")
    except ImportError:
        issues.append("[X] langchain package not installed")
        print("   Run: pip install langchain")

    try:
        from sentence_transformers import SentenceTransformer
        print("[OK] sentence-transformers package installed")
    except ImportError:
        issues.append("[X] sentence-transformers not installed")
        print("   Run: pip install sentence-transformers")

    print("\n" + "=" * 60)

    if issues:
        print(f"\n[SETUP NEEDED] Found {len(issues)} issue(s) - Setup required before testing")
        print("\nTo set up the system:")
        print("1. Copy .env.example to .env")
        print("2. Add your ANTHROPIC_API_KEY to .env")
        print("3. Install packages: pip install -r requirements_rag.txt")
        print("4. Build vector database: python build_database.py")
        return False
    else:
        print("\n[READY] All checks passed - Ready to test!")
        return True

def test_rag_system():
    """Test the basic RAG pipeline"""
    try:
        from rag_pipeline import RAGPipeline
        from dotenv import load_dotenv

        load_dotenv()

        print("\n" + "=" * 60)
        print("TESTING RAG SYSTEM")
        print("=" * 60)

        # Initialize RAG system
        print("\n[1/3] Initializing RAG pipeline...")
        from vector_store import VectorStoreManager
        vector_store = VectorStoreManager()
        rag = RAGPipeline(vector_store=vector_store)
        print("[OK] RAG pipeline initialized")

        # Test with first dream
        test_dream = TEST_DREAMS[0]
        print(f"\n[2/3] Testing with: {test_dream['name']}")
        print(f"Dream: {test_dream['dream'][:100]}...")

        print("\n[3/3] Generating interpretation...")
        result = rag.interpret_dream(
            dream_text=test_dream['dream'],
            user_context=test_dream['context']
        )

        print("\n" + "=" * 60)
        print("RAG SYSTEM RESULTS")
        print("=" * 60)
        print(f"\n{result.interpretation}")
        print(f"\n[SOURCES] Used {len(result.sources_used)} documents")
        print(f"[CONFIDENCE] {result.confidence_score:.1%}")

        return True

    except Exception as e:
        print(f"\n[ERROR] Error testing RAG system: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_agentic_system():
    """Test the multi-agent system"""
    try:
        from agentic_system import DreamInterpreterAgents
        from dotenv import load_dotenv

        load_dotenv()

        print("\n" + "=" * 60)
        print("TESTING AGENTIC SYSTEM")
        print("=" * 60)

        # Initialize agent system
        print("\n[1/3] Initializing agent system...")
        from vector_store import VectorStoreManager
        vector_store = VectorStoreManager()
        agents = DreamInterpreterAgents(vector_store=vector_store)
        print("[OK] Agent system initialized")

        # Test with second dream
        test_dream = TEST_DREAMS[1]
        print(f"\n[2/3] Testing with: {test_dream['name']}")
        print(f"Dream: {test_dream['dream'][:100]}...")

        print("\n[3/3] Running multi-agent analysis...")
        print("   (This may take 30-60 seconds as agents process sequentially)")

        result = agents.interpret_dream(
            dream_text=test_dream['dream'],
            user_context=test_dream['context']
        )

        print("\n" + "=" * 60)
        print("AGENTIC SYSTEM RESULTS")
        print("=" * 60)

        print(f"\n[SCIENTIFIC] SCIENTIFIC ANALYSIS:")
        print(result.symbol_analysis[:500] + "..." if len(result.symbol_analysis) > 500 else result.symbol_analysis)

        print(f"\n[PSYCHOLOGICAL] PSYCHOLOGICAL ANALYSIS:")
        print(result.psychological_analysis[:500] + "..." if len(result.psychological_analysis) > 500 else result.psychological_analysis)

        print(f"\n[CULTURAL] CULTURAL ANALYSIS:")
        print(result.cultural_analysis[:500] + "..." if len(result.cultural_analysis) > 500 else result.cultural_analysis)

        print(f"\n[FINAL] FINAL INTERPRETATION:")
        print(result.interpretation)

        print(f"\n[CONFIDENCE] {result.confidence_score:.1%}")
        print(f"[SOURCES] Used {len(result.sources_used)} documents")
        print(f"\n[AGENT TRACE]")
        for msg in result.agent_trace:
            print(f"  - {msg}")

        return True

    except Exception as e:
        print(f"\n[ERROR] Error testing agentic system: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test runner"""
    print("\n" + "=" * 60)
    print("DREAM INTERPRETER - QUICK TEST")
    print("=" * 60)

    # First check environment
    if not check_environment():
        print("\n[WARNING] Please complete setup steps above before testing")
        return

    # Ask what to test
    print("\nWhat would you like to test?")
    print("1. RAG System (faster, single-pass)")
    print("2. Agentic System (slower, multi-agent analysis)")
    print("3. Both systems")
    print("4. Just show test dreams (no API calls)")

    choice = input("\nEnter choice (1-4): ").strip()

    if choice == "1":
        test_rag_system()
    elif choice == "2":
        test_agentic_system()
    elif choice == "3":
        print("\nTesting both systems...")
        if test_rag_system():
            print("\n" + "="*60)
            input("\nPress Enter to continue to Agentic System test...")
            test_agentic_system()
    elif choice == "4":
        print("\n" + "=" * 60)
        print("TEST DREAMS")
        print("=" * 60)
        for i, dream in enumerate(TEST_DREAMS, 1):
            print(f"\n{i}. {dream['name']}:")
            print(f"   Dream: {dream['dream']}")
            print(f"   Context: {dream['context']}")
    else:
        print("[ERROR] Invalid choice")

if __name__ == "__main__":
    main()
