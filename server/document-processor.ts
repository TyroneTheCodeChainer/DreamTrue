/**
 * Document Processor for Research Papers
 * 
 * This module handles extraction and chunking of research PDFs for the RAG system.
 * It processes academic papers on dream analysis and prepares them for vector storage.
 * 
 * Key Features:
 * - PDF text extraction using pdf-parse
 * - Intelligent text chunking (preserves context)
 * - Metadata enrichment (source, category, validation level)
 * - Citation-ready output
 * 
 * Architecture:
 * - Uses pdf-parse for PDF reading (Node.js native, no Python dependency)
 * - Chunks text into ~1000 character segments with 200 char overlap
 * - Preserves paragraph boundaries where possible
 * - Attaches metadata for filtering and citation
 * 
 * Design Decisions:
 * - Chunk size 1000: Balance between context and specificity
 * - Overlap 200: Prevents losing context at boundaries
 * - Synchronous processing: PDFs are small (<10MB), async not needed
 */

import { readFileSync } from 'fs';
import { DocumentChunk } from './vector-store';
import { createRequire } from 'module';

// pdf-parse is a CommonJS module, need createRequire for ES modules
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Processed document ready for vector store
 */
export interface ProcessedDocument extends DocumentChunk {
  chunkIndex: number;  // Position within source document (0, 1, 2...)
  totalChunks: number; // Total chunks from this document
}

/**
 * Document Processor Class
 * 
 * Handles PDF extraction and chunking for research papers.
 */
export class DocumentProcessor {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;

    console.log(`DocumentProcessor initialized: chunk_size=${chunkSize}, overlap=${chunkOverlap}`);
  }

  /**
   * Extract text from PDF file
   * 
   * Uses pdf-parse library to read PDF and extract all text content.
   * Handles multi-page documents and preserves paragraph structure.
   * 
   * @param pdfPath - Path to PDF file (absolute or relative)
   * @returns Extracted text content
   */
  async extractTextFromPdf(pdfPath: string): Promise<string> {
    try {
      // Read PDF file as buffer
      const dataBuffer = readFileSync(pdfPath);
      
      // Parse PDF and extract text
      const data = await pdfParse(dataBuffer);
      
      // Clean up text (remove excessive whitespace)
      const cleanedText = data.text
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
        .trim();
      
      console.log(`Extracted ${cleanedText.length} characters from ${pdfPath} (${data.numpages} pages)`);
      
      return cleanedText;
    } catch (error: any) {
      console.error(`Failed to extract text from PDF ${pdfPath}:`, error.message);
      return '';
    }
  }

  /**
   * Split text into chunks with overlap
   * 
   * Implements sliding window chunking:
   * - Chunk 1: chars 0-1000
   * - Chunk 2: chars 800-1800 (200 char overlap)
   * - Chunk 3: chars 1600-2600
   * 
   * Overlap ensures important context isn't lost at chunk boundaries.
   * 
   * @param text - Full document text
   * @returns Array of text chunks
   */
  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      // Calculate end index for this chunk
      let endIndex = startIndex + this.chunkSize;

      // If not the last chunk, try to break at paragraph boundary
      if (endIndex < text.length) {
        const nextParagraph = text.indexOf('\n\n', endIndex - 100);
        if (nextParagraph !== -1 && nextParagraph < endIndex + 100) {
          // Found a paragraph break nearby, use it
          endIndex = nextParagraph;
        }
      }

      // Extract chunk
      const chunk = text.slice(startIndex, endIndex).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start index forward (accounting for overlap)
      startIndex += this.chunkSize - this.chunkOverlap;
    }

    console.log(`Split text into ${chunks.length} chunks`);
    return chunks;
  }

  /**
   * Process PDF into chunks with metadata
   * 
   * Main processing pipeline:
   * 1. Extract text from PDF
   * 2. Split into chunks
   * 3. Attach metadata to each chunk
   * 4. Return array of ProcessedDocument objects
   * 
   * @param pdfPath - Path to PDF file
   * @param metadata - Metadata to attach (source, category, author, year, etc.)
   * @returns Array of processed document chunks
   */
  async processPdf(
    pdfPath: string,
    metadata: Partial<DocumentChunk['metadata']>
  ): Promise<ProcessedDocument[]> {
    // Step 1: Extract text
    const text = await this.extractTextFromPdf(pdfPath);
    
    if (!text) {
      console.warn(`No text extracted from ${pdfPath}, skipping`);
      return [];
    }

    // Step 2: Split into chunks
    const textChunks = this.splitTextIntoChunks(text);
    
    // Step 3: Create ProcessedDocument objects with metadata
    const processedDocs: ProcessedDocument[] = textChunks.map((chunk, index) => ({
      content: chunk,
      metadata: {
        source: metadata.source || pdfPath.split('/').pop() || 'unknown',
        category: metadata.category || 'general',
        page: metadata.page,
        author: metadata.author,
        year: metadata.year,
        doi: metadata.doi,
        validation: metadata.validation || 'unknown',
      },
      chunkIndex: index,
      totalChunks: textChunks.length,
    }));

    console.log(`Processed PDF "${metadata.source}": ${processedDocs.length} chunks created`);
    
    return processedDocs;
  }

  /**
   * Process multiple PDFs in batch
   * 
   * Convenience method for processing research paper collections.
   * 
   * @param pdfConfigs - Array of {path, metadata} objects
   * @returns Flattened array of all processed chunks
   */
  async processPdfBatch(
    pdfConfigs: Array<{ path: string; metadata: Partial<DocumentChunk['metadata']> }>
  ): Promise<ProcessedDocument[]> {
    console.log(`Processing ${pdfConfigs.length} PDFs in batch...`);
    
    const allChunks: ProcessedDocument[] = [];

    for (const config of pdfConfigs) {
      const chunks = await this.processPdf(config.path, config.metadata);
      allChunks.push(...chunks);
    }

    console.log(`Batch processing complete: ${allChunks.length} total chunks from ${pdfConfigs.length} PDFs`);
    
    return allChunks;
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor();
