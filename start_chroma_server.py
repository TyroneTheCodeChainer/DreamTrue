#!/usr/bin/env python3
"""
ChromaDB Server for DreamTrue RAG System
Starts persistent ChromaDB HTTP server on port 8000
"""

import sys
import os

# Set environment variables before importing chromadb
os.environ['ALLOW_RESET'] = 'TRUE'
os.environ['ANONYMIZED_TELEMETRY'] = 'FALSE'

try:
    import chromadb
    from chromadb.config import Settings
    print(f"✓ ChromaDB version: {chromadb.__version__}")
    
    # Create persistent client
    client = chromadb.PersistentClient(
        path="./chroma_db",
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
    
    print(f"✓ ChromaDB initialized at ./chroma_db")
    print(f"✓ Collections: {len(client.list_collections())}")
    
    # ChromaDB v1.x doesn't have built-in HTTP server in the client library
    # We need to use the CLI command or run it differently
    print("\n⚠️  ChromaDB HTTP server requires manual start:")
    print("   Run: python3 -m chromadb.server --path ./chroma_db")
    
except ImportError as e:
    print(f"❌ Failed to import chromadb: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
