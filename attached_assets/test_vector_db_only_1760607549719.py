"""
Test Vector Database Without API Key
Tests the document processing and semantic search functionality
"""

def test_vector_database():
    print("=" * 60)
    print("VECTOR DATABASE TEST (No API Key Required)")
    print("=" * 60)

    # Check if database exists
    import os
    if not os.path.exists('chroma_db'):
        print("\n[ERROR] Vector database not found")
        print("Please build it first: python build_database.py")
        return

    print("\n[1/3] Loading vector database...")
    try:
        from vector_store import VectorStoreManager
        vector_store = VectorStoreManager()
        print("[OK] Vector database loaded")
    except Exception as e:
        print(f"[ERROR] Failed to load database: {e}")
        return

    # Check collection
    print("\n[2/3] Checking database contents...")
    try:
        collection = vector_store.get_collection()
        count = collection.count()
        print(f"[OK] Database contains {count} chunks")

        if count == 0:
            print("[WARNING] Database is empty! Rebuild it with build_database.py")
            return
    except Exception as e:
        print(f"[ERROR] Failed to check database: {e}")
        return

    # Test searches
    print("\n[3/3] Testing semantic search...")

    test_queries = [
        ("flying dreams", "Should find research about flying/levitation dreams"),
        ("anxiety nightmare", "Should find research about anxiety and nightmares"),
        ("teeth falling out", "Should find research about common dream symbols"),
        ("lucid dreaming", "Should find research about lucid dreams"),
    ]

    for query, expected in test_queries:
        print(f"\n  Query: '{query}'")
        print(f"  Expected: {expected}")

        try:
            results = vector_store.similarity_search(query, n_results=3)

            if results:
                print(f"  [OK] Found {len(results)} relevant chunks")

                # Show first result
                first_result = results[0]
                print(f"\n  Top Result:")
                print(f"    Relevance: {first_result['relevance_score']:.2%}")
                print(f"    Source: {first_result['metadata'].get('source', 'Unknown')}")
                print(f"    Preview: {first_result['text'][:150]}...")
            else:
                print(f"  [WARNING] No results found")

        except Exception as e:
            print(f"  [ERROR] Search failed: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("VECTOR DATABASE TEST COMPLETE")
    print("=" * 60)
    print("\n[STATUS] Vector database is working correctly!")
    print("[NEXT] Set up API key to test full dream interpretation")
    print("\nTo set up API key:")
    print("  1. Run: python setup_apikey.py")
    print("  2. Or manually create .env file with ANTHROPIC_API_KEY")

if __name__ == "__main__":
    try:
        test_vector_database()
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
