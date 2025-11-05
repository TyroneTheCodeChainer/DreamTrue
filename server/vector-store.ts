/**
 * Vector Store for Dream Research Citations
 * 
 * This module manages a ChromaDB vector database containing research papers
 * on dream analysis, psychology, and neuroscience. It enables RAG (Retrieval-
 * Augmented Generation) by finding relevant research context before AI interpretation.
 * 
 * Key Features:
 * - Semantic search over research paper chunks
 * - Metadata filtering (category, validation level)
 * - Citation-ready results with source information
 * - Persistent storage (survives server restarts)
 * 
 * Architecture:
 * - Uses ChromaDB TypeScript client
 * - Stores document chunks with metadata (source, category, page)
 * - Returns top-k most relevant chunks for dream interpretation context
 * 
 * Brand Alignment:
 * - Enables "Real insights. Rooted in research" promise
 * - Prevents AI hallucination by grounding in real papers
 * - Provides traceable citations (PubMed, arXiv, APA PsycNet)
 */

import { ChromaClient, Collection } from 'chromadb';

/**
 * Document chunk with metadata for citation
 */
export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;        // Paper title or filename
    category: string;      // "neuroscience", "psychology", "content_analysis"
    page?: number;         // Page number in original PDF
    author?: string;       // Author names
    year?: number;         // Publication year
    doi?: string;          // DOI for direct citation
    validation?: string;   // "peer_reviewed", "preprint", "book"
  };
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  content: string;
  metadata: DocumentChunk['metadata'];
  relevanceScore: number;  // 0-1, higher = more relevant
  citation: string;        // Formatted citation (APA style)
}

/**
 * Vector Store Class
 * 
 * Manages ChromaDB collection for research documents.
 * Singleton pattern ensures one database connection.
 */
export class VectorStore {
  private client: ChromaClient;
  private collection: Collection | null = null;
  private collectionName = 'dream_research';

  constructor() {
    // Initialize ChromaDB client
    // Connects to ChromaDB server (default: localhost:8000)
    const chromaHost = process.env.CHROMA_HOST || 'localhost';
    const chromaPort = process.env.CHROMA_PORT || '8000';
    
    this.client = new ChromaClient({
      host: chromaHost,
      port: chromaPort
    });
  }

  /**
   * Initialize or get existing collection
   * 
   * Collections in ChromaDB are like tables - they group related documents.
   * We use one collection for all dream research papers.
   * 
   * Design Note: Called lazily on first use (not in constructor) to avoid
   * blocking server startup if ChromaDB is slow.
   */
  async initializeCollection(): Promise<void> {
    try {
      // Try to get existing collection first
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          description: 'Research papers on dream analysis and psychology',
          'hnsw:space': 'cosine', // Cosine similarity for semantic search
        },
      });
      
      const count = await this.collection.count();
      console.log(`Vector store initialized: ${count} documents in collection "${this.collectionName}"`);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw new Error('Vector database unavailable - citations will not work');
    }
  }

  /**
   * Add document chunks to vector store
   * 
   * Used during research paper ingestion to populate the database.
   * Each chunk becomes a searchable unit with embeddings.
   * 
   * @param documents - Array of document chunks with metadata
   */
  async addDocuments(documents: DocumentChunk[]): Promise<void> {
    if (!this.collection) {
      await this.initializeCollection();
    }

    if (documents.length === 0) {
      console.warn('No documents to add to vector store');
      return;
    }

    // Prepare data for ChromaDB
    const ids: string[] = [];
    const texts: string[] = [];
    const metadatas: any[] = [];

    documents.forEach((doc, index) => {
      // Generate unique ID: source_timestamp_index
      const timestamp = Date.now();
      const id = `${doc.metadata.source}_${timestamp}_${index}`;
      
      ids.push(id);
      texts.push(doc.content);
      metadatas.push(doc.metadata);
    });

    // Add to collection (ChromaDB handles embedding generation)
    await this.collection!.add({
      ids,
      documents: texts,
      metadatas,
    });

    console.log(`Added ${documents.length} document chunks to vector store`);
  }

  /**
   * Search for relevant research context
   * 
   * This is the core RAG retrieval function. Given a dream description,
   * it finds the most semantically similar research paper chunks.
   * 
   * @param query - Dream text or analysis query
   * @param nResults - Number of chunks to retrieve (default: 5)
   * @param categoryFilter - Optional category filter ("neuroscience", "psychology")
   * @returns Array of search results with citations
   */
  async search(
    query: string,
    nResults: number = 5,
    categoryFilter?: string
  ): Promise<SearchResult[]> {
    if (!this.collection) {
      await this.initializeCollection();
    }

    // Build metadata filter if category specified
    const where = categoryFilter ? { category: categoryFilter } : undefined;

    // Perform semantic search
    const results = await this.collection!.query({
      queryTexts: [query],
      nResults,
      where,
    });

    // Format results with citations
    const searchResults: SearchResult[] = [];

    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas?.[0]?.[i] as DocumentChunk['metadata'];
        const distance = results.distances?.[0]?.[i] || 1;
        const content = results.documents?.[0]?.[i] || '';

        // Convert distance to relevance score (0-1, higher = better)
        const relevanceScore = Math.max(0, 1 - distance);

        // Format citation (APA style)
        const citation = this.formatCitation(metadata);

        searchResults.push({
          content,
          metadata,
          relevanceScore,
          citation,
        });
      }
    }

    return searchResults;
  }

  /**
   * Format citation in APA style
   * 
   * Examples:
   * - "Smith, J. (2020). Dream Analysis Methods. Journal of Sleep Research."
   * - "Nielsen et al. (2010). REM Sleep and Dream Content."
   * 
   * @param metadata - Document metadata
   * @returns APA-formatted citation string
   */
  private formatCitation(metadata: DocumentChunk['metadata']): string {
    const { author, year, source, doi } = metadata;

    // Basic format: Author (Year). Title.
    let citation = '';

    if (author && year) {
      citation = `${author} (${year}). ${source}`;
    } else if (year) {
      citation = `(${year}). ${source}`;
    } else {
      citation = source;
    }

    // Add DOI if available for direct lookup
    if (doi) {
      citation += ` https://doi.org/${doi}`;
    }

    return citation;
  }

  /**
   * Get document count (for debugging)
   */
  async getDocumentCount(): Promise<number> {
    if (!this.collection) {
      await this.initializeCollection();
    }
    return await this.collection!.count();
  }

  /**
   * Clear all documents (use with caution!)
   * Only for testing/development - not exposed via API
   */
  async clearCollection(): Promise<void> {
    if (!this.collection) {
      await this.initializeCollection();
    }
    await this.client.deleteCollection({ name: this.collectionName });
    console.log('Vector store collection cleared');
    this.collection = null;
  }
}

// Singleton instance for application-wide use
export const vectorStore = new VectorStore();
