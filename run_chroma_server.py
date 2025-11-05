#!/usr/bin/env python3
"""
Simple ChromaDB Server Runner
Starts ChromaDB server for DreamTrue RAG system
"""
import chromadb
from chromadb.config import Settings
import uvicorn

def run_server():
    print("Starting ChromaDB server...")
    print("Data directory: ./chroma_db")
    print("Server: http://0.0.0.0:8000")
    
    # Create ChromaDB client with persistent storage
    client = chromadb.PersistentClient(path="./chroma_db")
    
    print(f"✓ ChromaDB initialized")
    print(f"Collections: {client.list_collections()}")
    
    # Start HTTP server (ChromaDB v1.x uses FastAPI/Uvicorn)
    from chromadb.server.fastapi import FastAPI as ChromaApp
    
    app = ChromaApp(
        settings=Settings(
            chroma_db_impl="chromadb.db.impl.sqlite.SqliteDB",
            persist_directory="./chroma_db",
            anonymized_telemetry=False
        )
    )
    
    print("\n✓ Starting HTTP server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    run_server()
