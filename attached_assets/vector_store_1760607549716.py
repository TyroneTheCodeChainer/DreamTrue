#!/usr/bin/env python3
"""
Vector Store Manager for RAG System
Handles document embedding and vector database operations using ChromaDB
"""

import os
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from langchain.embeddings import OpenAIEmbeddings, HuggingFaceEmbeddings
from document_processor import DocumentProcessor, ProcessedDocument

class VectorStoreManager:
    """Manages vector database operations for dream interpretation RAG"""

    def __init__(
        self,
        collection_name: str = "dream_research",
        persist_directory: str = "./chroma_db",
        embedding_provider: str = "huggingface"  # or "openai"
    ):
        """
        Initialize vector store manager with ChromaDB backend

        This sets up the vector database for storing and retrieving research document chunks.
        The database persists to disk, so embeddings only need to be generated once.

        Args:
            collection_name: Name of the ChromaDB collection (default: "dream_research")
                            - Collections are like tables in a traditional database
                            - Each collection can have its own embedding function
            persist_directory: Directory to persist vector database (default: "./chroma_db")
                             - Database is saved to disk for reuse across sessions
                             - Creates directory if it doesn't exist
            embedding_provider: Which embedding model to use (default: "huggingface")
                              - "huggingface": Free, runs locally, all-MiniLM-L6-v2 model
                              - "openai": Requires API key, text-embedding-3-small model
                              - HuggingFace is recommended for cost-effectiveness

        What happens during initialization:
            1. Creates persist directory if needed
            2. Initializes ChromaDB persistent client
            3. Sets up embedding function (converts text to vectors)
            4. Gets existing collection or creates new one
            5. Prints confirmation message
        """
        self.collection_name = collection_name
        self.persist_directory = persist_directory
        self.embedding_provider = embedding_provider

        # Create persist directory if it doesn't exist
        # parents=True creates intermediate directories
        # exist_ok=True doesn't error if directory already exists
        Path(persist_directory).mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client with persistence
        # PersistentClient saves data to disk (vs Client which is in-memory only)
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,  # Disable usage tracking
                allow_reset=True             # Allow collection deletion for testing
            )
        )

        # Set up embedding function based on provider
        # This converts text chunks to vector embeddings
        self._setup_embedding_function()

        # Get existing collection or create new one
        # Collection holds all document vectors and metadata
        self.collection = self._get_or_create_collection()

        # Print confirmation for user
        print(f"Vector store initialized: {collection_name}")
        print(f"Persist directory: {persist_directory}")
        print(f"Embedding provider: {embedding_provider}")

    def _setup_embedding_function(self):
        """
        Set up the embedding function based on provider

        Embedding functions convert text to numerical vectors that capture semantic meaning.
        Documents with similar meaning will have similar vectors (close in vector space).

        Providers:
            - OpenAI: High quality, costs money, requires API key
                     Model: text-embedding-3-small (1536 dimensions)
                     Cost: ~$0.02 per 1M tokens
            - HuggingFace: Free, runs locally, good quality
                          Model: all-MiniLM-L6-v2 (384 dimensions)
                          Speed: ~500 docs/sec on CPU

        Note: The embedding function must match when loading an existing collection
        """
        if self.embedding_provider == "openai":
            # Try to use OpenAI embeddings (requires API key in environment)
            api_key = os.getenv("OPENAI_API_KEY")

            if not api_key:
                # Fallback to HuggingFace if API key not found
                print("Warning: OPENAI_API_KEY not found, falling back to HuggingFace")
                self.embedding_provider = "huggingface"
            else:
                # Initialize OpenAI embedding function
                self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                    api_key=api_key,
                    model_name="text-embedding-3-small"  # Latest OpenAI embedding model
                )
                return  # Exit early if OpenAI setup successful

        # Default to HuggingFace embeddings (free, local, no API key needed)
        # all-MiniLM-L6-v2 is a sentence-transformers model
        # - 384 dimensional embeddings
        # - Trained on 1B+ sentence pairs
        # - Fast inference on CPU
        # - Good quality for semantic search
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"  # Fast, good quality, free
        )

    def _get_or_create_collection(self):
        """Get existing collection or create new one"""
        try:
            collection = self.client.get_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function
            )
            print(f"Loaded existing collection with {collection.count()} documents")
            return collection
        except Exception:
            collection = self.client.create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function,
                metadata={"description": "Dream research papers and analysis"}
            )
            print("Created new collection")
            return collection

    def add_documents(self, documents: List[ProcessedDocument]):
        """
        Add documents to vector store

        Args:
            documents: List of ProcessedDocument objects
        """
        if not documents:
            print("No documents to add")
            return

        # Prepare data for ChromaDB
        ids = []
        texts = []
        metadatas = []

        for doc in documents:
            # Create unique ID
            doc_id = f"{doc.doc_id}_chunk_{doc.chunk_id}"
            ids.append(doc_id)
            texts.append(doc.content)
            metadatas.append(doc.metadata)

        # Add to collection in batches
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i+batch_size]
            batch_texts = texts[i:i+batch_size]
            batch_metadatas = metadatas[i:i+batch_size]

            self.collection.add(
                ids=batch_ids,
                documents=batch_texts,
                metadatas=batch_metadatas
            )

            print(f"Added batch {i//batch_size + 1}: {len(batch_ids)} documents")

        print(f"Total documents in collection: {self.collection.count()}")

    def similarity_search(
        self,
        query: str,
        n_results: int = 5,
        filter_dict: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Perform similarity search

        Args:
            query: Search query
            n_results: Number of results to return
            filter_dict: Optional metadata filter

        Returns:
            List of search results with documents and metadata
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=filter_dict,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "id": results['ids'][0][i],
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i],
                "relevance_score": 1 - results['distances'][0][i]  # Convert distance to similarity
            })

        return formatted_results

    def hybrid_search(
        self,
        query: str,
        n_results: int = 10,
        categories: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Advanced hybrid search combining semantic and metadata filtering

        Args:
            query: Search query
            n_results: Number of results
            categories: Optional category filter

        Returns:
            Ranked search results
        """
        # Build filter
        filter_dict = None
        if categories:
            filter_dict = {"category": {"$in": categories}}

        # Perform semantic search
        results = self.similarity_search(query, n_results * 2, filter_dict)

        # Re-rank based on validation weight
        for result in results:
            weight = result['metadata'].get('weight', 0.1)
            # Boost score by validation weight
            result['final_score'] = result['relevance_score'] * (1 + weight)

        # Sort by final score
        results.sort(key=lambda x: x['final_score'], reverse=True)

        return results[:n_results]

    def get_context_for_query(
        self,
        query: str,
        max_tokens: int = 3000,
        n_results: int = 5
    ) -> Tuple[str, List[Dict]]:
        """
        Get formatted context for RAG query

        Args:
            query: User query
            max_tokens: Maximum context tokens
            n_results: Number of chunks to retrieve

        Returns:
            Tuple of (formatted_context, source_documents)
        """
        # Get relevant documents
        results = self.hybrid_search(query, n_results)

        # Build context
        context_parts = []
        total_chars = 0
        max_chars = max_tokens * 4  # Rough approximation

        for idx, result in enumerate(results):
            source = result['metadata'].get('source', 'Unknown')
            category = result['metadata'].get('category', 'general')
            validation = result['metadata'].get('validation', 'N/A')

            chunk_text = f"""
[Source {idx+1}: {source} | Category: {category} | Validation: {validation}]
{result['content']}
---
"""
            chunk_chars = len(chunk_text)

            if total_chars + chunk_chars > max_chars:
                break

            context_parts.append(chunk_text)
            total_chars += chunk_chars

        formatted_context = "\n".join(context_parts)
        return formatted_context, results

    def delete_collection(self):
        """Delete the current collection"""
        self.client.delete_collection(name=self.collection_name)
        print(f"Deleted collection: {self.collection_name}")

    def reset_collection(self):
        """Reset collection by deleting and recreating"""
        try:
            self.delete_collection()
        except Exception:
            pass
        self.collection = self._get_or_create_collection()
        print("Collection reset complete")

    def get_stats(self) -> Dict:
        """Get collection statistics"""
        count = self.collection.count()

        # Get sample to analyze categories
        sample = self.collection.get(limit=count)
        categories = {}
        sources = set()

        for metadata in sample['metadatas']:
            category = metadata.get('category', 'unknown')
            categories[category] = categories.get(category, 0) + 1
            sources.add(metadata.get('source', 'Unknown'))

        return {
            "total_chunks": count,
            "unique_sources": len(sources),
            "categories": categories,
            "embedding_provider": self.embedding_provider
        }

def build_vector_database():
    """Build vector database from research documents"""
    print("=" * 80)
    print("Building Vector Database for Dream Interpreter RAG")
    print("=" * 80)

    # Initialize document processor
    print("\n1. Processing research documents...")
    from document_processor import create_research_metadata_map

    processor = DocumentProcessor(chunk_size=1000, chunk_overlap=200)

    # Set up paths
    base_path = Path(__file__).parent.parent
    research_dir = base_path / "Resources and References"

    # Create metadata map
    metadata_map = create_research_metadata_map()

    # Process documents
    chunks = processor.process_directory(str(research_dir), metadata_map)

    print(f"\nProcessed {len(chunks)} chunks from research documents")

    # Initialize vector store
    print("\n2. Initializing vector store...")
    vector_store = VectorStoreManager(
        collection_name="dream_research",
        embedding_provider="huggingface"  # Free and local
    )

    # Reset collection if it exists (for clean rebuild)
    if vector_store.collection.count() > 0:
        print("\nResetting existing collection...")
        vector_store.reset_collection()

    # Add documents to vector store
    print("\n3. Adding documents to vector store...")
    vector_store.add_documents(chunks)

    # Show statistics
    print("\n" + "=" * 80)
    print("Vector Database Built Successfully!")
    print("=" * 80)
    stats = vector_store.get_stats()
    print(f"\nStatistics:")
    print(f"  Total chunks: {stats['total_chunks']}")
    print(f"  Unique sources: {stats['unique_sources']}")
    print(f"  Embedding provider: {stats['embedding_provider']}")
    print(f"\n  Categories:")
    for category, count in stats['categories'].items():
        print(f"    {category}: {count} chunks")

    # Test search
    print("\n" + "=" * 80)
    print("Testing Search Functionality")
    print("=" * 80)

    test_query = "What do dreams about teeth falling out mean?"
    print(f"\nQuery: {test_query}")

    results = vector_store.similarity_search(test_query, n_results=3)

    print(f"\nTop 3 Results:")
    for idx, result in enumerate(results):
        print(f"\n{idx+1}. Source: {result['metadata'].get('source', 'Unknown')}")
        print(f"   Category: {result['metadata'].get('category', 'N/A')}")
        print(f"   Relevance: {result['relevance_score']:.3f}")
        print(f"   Preview: {result['content'][:200]}...")

    return vector_store

def main():
    """Main function to build and test vector database"""
    vector_store = build_vector_database()

    print("\n" + "=" * 80)
    print("Vector database ready for RAG pipeline!")
    print("=" * 80)

if __name__ == "__main__":
    main()
