/**
 * Vector Store for Dream Research Citations
 * 
 * This module manages a vector database containing research papers
 * on dream analysis, psychology, and neuroscience. It enables RAG (Retrieval-
 * Augmented Generation) by finding relevant research context before AI interpretation.
 * 
 * Key Features:
 * - Semantic search over research paper chunks
 * - Metadata filtering (category, validation level)
 * - Citation-ready results with source information
 * - Persistent file-based storage (survives server restarts)
 * 
 * Architecture:
 * - Uses Vectra (pure TypeScript, embedded, no server needed)
 * - Uses @xenova/transformers for local embeddings (no API calls)
 * - Stores document chunks with metadata (source, category, page)
 * - Returns top-k most relevant chunks for dream interpretation context
 * 
 * Brand Alignment:
 * - Enables "Real insights. Rooted in research" promise
 * - Prevents AI hallucination by grounding in real papers
 * - Provides traceable citations (PubMed, arXiv, APA PsycNet)
 */

import { LocalIndex } from 'vectra';
import { pipeline } from '@xenova/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Manages vector database for research documents using Vectra.
 * Singleton pattern ensures one database connection.
 * 
 * **Why Vectra over ChromaDB:**
 * - No server required (embedded, file-based)
 * - Pure TypeScript (easier deployment)
 * - Local embeddings (no API calls for embedding)
 * - Meets bootcamp RAG requirements
 */
export class VectorStore {
  private index: LocalIndex | null = null;
  private embedder: any = null;
  private indexPath: string;
  private initialized: boolean = false;

  constructor() {
    // Store vector index in ./vector_db directory
    this.indexPath = path.join(process.cwd(), 'vector_db');
  }

  /**
   * Initialize vector index and embedding model
   * 
   * Uses Vectra for file-based storage and Xenova transformers
   * for local embedding generation (no API calls needed).
   * 
   * Design Note: Called lazily on first use (not in constructor) to avoid
   * blocking server startup if model loading is slow.
   */
  async initializeCollection(): Promise<void> {
    if (this.initialized) {
      return; // Already initialized
    }

    try {
      console.log('Initializing vector store...');
      
      // Initialize Vectra index (file-based, no server needed)
      this.index = new LocalIndex(this.indexPath);
      
      // Create index if it doesn't exist
      if (!(await this.index.isIndexCreated())) {
        console.log('Creating new vector index...');
        await this.index.createIndex();
      }

      // Initialize embedding model (runs locally, no API needed)
      // Using all-MiniLM-L6-v2: fast, 384-dim embeddings, perfect for semantic search
      console.log('Loading embedding model (this may take a moment on first run)...');
      this.embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );

      const itemCount = await this.index.listItems();
      console.log(`✅ Vector store initialized: ${itemCount.length} documents indexed`);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize vector store:', error);
      throw new Error('Vector database unavailable - citations will not work');
    }
  }

  /**
   * Generate embedding for text using local model
   * 
   * @param text - Text to embed
   * @returns Embedding vector (384 dimensions)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedding model not initialized');
    }

    // Generate embedding using Xenova transformers
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to array
    return Array.from(output.data);
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
    if (!this.index) {
      await this.initializeCollection();
    }

    if (documents.length === 0) {
      console.warn('No documents to add to vector store');
      return;
    }

    console.log(`Embedding ${documents.length} document chunks...`);

    // Process documents in batches to avoid overwhelming the model
    const batchSize = 10;
    let addedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      for (const doc of batch) {
        try {
          // Generate embedding for document content
          const embedding = await this.generateEmbedding(doc.content);

          // Generate unique ID
          const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Add to index with metadata
          await this.index!.insertItem({
            id,
            vector: embedding,
            metadata: {
              content: doc.content,
              ...doc.metadata,
            },
          });

          addedCount++;
        } catch (error) {
          console.error(`Failed to add document: ${error}`);
        }
      }

      console.log(`Progress: ${Math.min(i + batchSize, documents.length)}/${documents.length} documents processed`);
    }

    console.log(`✅ Added ${addedCount} document chunks to vector store`);
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
    if (!this.index) {
      await this.initializeCollection();
    }

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search vector index (vectra needs: vector, originalQuery, topK)
      const results = await this.index!.queryItems(queryEmbedding, query, nResults * 2); // Get more to filter

      // Filter by category if specified
      let filteredResults = results;
      if (categoryFilter) {
        filteredResults = results.filter(
          (r: any) => r.item.metadata.category === categoryFilter
        );
      }

      // Take top nResults after filtering
      filteredResults = filteredResults.slice(0, nResults);

      // Format results with citations
      const searchResults: SearchResult[] = filteredResults.map((result: any) => {
        const metadata = result.item.metadata;
        
        // Vectra returns score (higher = more similar, typically 0-1)
        const relevanceScore = result.score;

        // Format citation (APA style)
        const citation = this.formatCitation(metadata);

        return {
          content: metadata.content,
          metadata: {
            source: metadata.source,
            category: metadata.category,
            page: metadata.page,
            author: metadata.author,
            year: metadata.year,
            doi: metadata.doi,
            validation: metadata.validation,
          },
          relevanceScore,
          citation,
        };
      });

      return searchResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
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
  private formatCitation(metadata: any): string {
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
    if (!this.index) {
      await this.initializeCollection();
    }
    const items = await this.index!.listItems();
    return items.length;
  }

  /**
   * Clear all documents (use with caution!)
   * Only for testing/development - not exposed via API
   */
  async clearCollection(): Promise<void> {
    if (!this.index) {
      await this.initializeCollection();
    }
    await this.index!.deleteIndex();
    await this.index!.createIndex();
    console.log('✅ Vector store collection cleared');
  }
}

// Singleton instance for application-wide use
export const vectorStore = new VectorStore();
