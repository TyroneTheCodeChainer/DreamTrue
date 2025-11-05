#!/bin/bash
echo "Starting ChromaDB server..."
exec chroma run --path ./chroma_db --host 0.0.0.0 --port 8000
