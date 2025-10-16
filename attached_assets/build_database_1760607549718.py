"""
Build Vector Database from Research PDFs
Run this after installing packages and setting up .env file
"""

from document_processor import DocumentProcessor
from vector_store import VectorStoreManager
import os
import sys

def main():
    print("=" * 60)
    print("BUILDING VECTOR DATABASE")
    print("=" * 60)

    # Check if PDFs folder exists
    pdf_folder = "../Resources and References"
    if not os.path.exists(pdf_folder):
        print(f"\n[ERROR] PDF folder not found: {pdf_folder}")
        print("Please ensure research PDFs are in the correct location")
        return

    # Count PDFs
    pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith('.pdf')]
    print(f"\n[INFO] Found {len(pdf_files)} PDF files")

    if len(pdf_files) == 0:
        print("[ERROR] No PDF files found in Resources folder")
        return

    print("\n[1/3] Initializing processors...")
    processor = DocumentProcessor()
    vector_store = VectorStoreManager()
    print("[OK] Processors initialized")

    print("\n[2/3] Processing PDFs...")
    print("This will take 3-5 minutes depending on PDF size...")

    try:
        # Import metadata map
        from document_processor import create_research_metadata_map
        metadata_map = create_research_metadata_map()

        chunks = processor.process_directory(pdf_folder, metadata_map)
        print(f"[OK] Processed {len(chunks)} chunks from {len(pdf_files)} PDFs")
    except Exception as e:
        print(f"[ERROR] Failed to process PDFs: {e}")
        import traceback
        traceback.print_exc()
        return

    print("\n[3/3] Adding chunks to vector database...")
    print("Creating embeddings (this may take a few minutes)...")

    try:
        vector_store.add_documents(chunks)
        print("[OK] Chunks added to database")
    except Exception as e:
        print(f"[ERROR] Failed to add to database: {e}")
        import traceback
        traceback.print_exc()
        return

    # Verify
    print("\n[VERIFY] Checking database...")
    try:
        count = vector_store.collection.count()
        print(f"[SUCCESS] Vector database contains {count} chunks")

        # Test search
        print("\n[TEST] Testing search functionality...")
        test_results = vector_store.similarity_search("flying dreams", n_results=3)
        print(f"[OK] Search returned {len(test_results)} results")

        print("\n" + "=" * 60)
        print("DATABASE BUILD COMPLETE!")
        print("=" * 60)
        print("\nYou can now run: python quick_test.py")
        print("\nDatabase location: ./chroma_db")
        print(f"Total chunks: {count}")
        print(f"Source PDFs: {len(pdf_files)}")

    except Exception as e:
        print(f"[ERROR] Verification failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Build interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
