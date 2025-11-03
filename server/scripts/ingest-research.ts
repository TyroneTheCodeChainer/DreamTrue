/**
 * Research Paper Ingestion Script
 * 
 * This script populates the ChromaDB vector database with research papers
 * on dream analysis, psychology, and neuroscience. It ensures DreamTrue's
 * "Real insights. Rooted in research" promise by grounding AI responses
 * in actual peer-reviewed publications.
 * 
 * Usage:
 *   npx tsx server/scripts/ingest-research.ts
 * 
 * Requirements:
 * - ChromaDB running (automatically starts with default client)
 * - Research PDFs placed in attached_assets/research_papers/
 * - Metadata configured in RESEARCH_PAPERS array below
 * 
 * Architecture:
 * - Reads PDFs from filesystem
 * - Extracts text and chunks into ~1000 char segments
 * - Stores in ChromaDB with metadata (author, year, DOI, category)
 * - Enables semantic search during dream interpretation
 * 
 * CRITICAL: Only add REAL research papers with valid citations.
 * No AI-generated or hallucinated sources. Verify DOIs before adding.
 */

import { documentProcessor } from '../document-processor';
import { vectorStore, DocumentChunk } from '../vector-store';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Research paper configuration type
 */
interface PaperConfig {
  path: string;
  metadata: Partial<DocumentChunk['metadata']>;
}

/**
 * Research paper configurations
 * 
 * Each entry represents one PDF to ingest. Add real papers here with
 * verified metadata. Examples shown are placeholders - replace with
 * actual research from PubMed, arXiv, Google Scholar, APA PsycNet.
 * 
 * Categories:
 * - neuroscience: Brain activity, REM sleep, neural correlates
 * - psychology: Dream content, emotional processing, memory consolidation
 * - content_analysis: Symbol interpretation, cultural meanings, archetypes
 * 
 * Validation levels:
 * - peer_reviewed: Published in academic journals (highest priority)
 * - preprint: arXiv, bioRxiv (use with caution, note in metadata)
 * - book: Academic books (cite chapter/section)
 */
const RESEARCH_PAPERS: PaperConfig[] = [
  // Example 1: Neuroscience paper on REM sleep
  // {
  //   path: 'attached_assets/research_papers/nielsen_2010_rem_sleep_dreaming.pdf',
  //   metadata: {
  //     source: 'REM Sleep and Dreaming: Towards a Theory of Protoconsciousness',
  //     author: 'Nielsen, T.',
  //     year: 2010,
  //     category: 'neuroscience',
  //     validation: 'peer_reviewed',
  //     doi: '10.1038/nrn2716',
  //   },
  // },
  
  // Example 2: Psychology paper on dream content
  // {
  //   path: 'attached_assets/research_papers/domhoff_2017_dream_content.pdf',
  //   metadata: {
  //     source: 'The Invasion of the Concept Snatchers: The Origins, Distortions, and Future of the Continuity Hypothesis',
  //     author: 'Domhoff, G. W.',
  //     year: 2017,
  //     category: 'psychology',
  //     validation: 'peer_reviewed',
  //     doi: '10.1037/drm0000047',
  //   },
  // },
  
  // Example 3: Content analysis book chapter
  // {
  //   path: 'attached_assets/research_papers/jung_1964_man_symbols_dreams.pdf',
  //   metadata: {
  //     source: 'Man and His Symbols',
  //     author: 'Jung, C. G.',
  //     year: 1964,
  //     category: 'content_analysis',
  //     validation: 'book',
  //   },
  // },
];

/**
 * Main ingestion function
 * 
 * Processes all configured research papers and loads them into ChromaDB.
 */
async function ingestResearchPapers() {
  console.log('\n=== DreamTrue Research Ingestion ===\n');
  console.log('Brand Promise: Real insights. Rooted in research.');
  console.log('Purpose: Prevent AI hallucination by grounding in peer-reviewed papers\n');

  // Step 1: Initialize vector store
  console.log('Initializing vector database...');
  try {
    await vectorStore.initializeCollection();
    const existingCount = await vectorStore.getDocumentCount();
    console.log(`Vector store ready. Current document count: ${existingCount}\n`);
  } catch (error: any) {
    console.error('Failed to initialize vector store:', error.message);
    console.error('\nTroubleshooting:');
    console.error('- Is ChromaDB installed? Run: npm install chromadb');
    console.error('- ChromaDB uses in-memory storage by default, no server needed');
    process.exit(1);
  }

  // Step 2: Validate PDF files exist
  console.log(`Validating ${RESEARCH_PAPERS.length} research papers...`);
  
  if (RESEARCH_PAPERS.length === 0) {
    console.warn('\n⚠️  WARNING: No research papers configured!');
    console.warn('To add real research:');
    console.warn('1. Download PDFs from PubMed, arXiv, Google Scholar, or APA PsycNet');
    console.warn('2. Place them in: attached_assets/research_papers/');
    console.warn('3. Add metadata to RESEARCH_PAPERS array in this script');
    console.warn('4. Run: npx tsx server/scripts/ingest-research.ts\n');
    console.warn('Example research to find:');
    console.warn('- Nielsen (2010): "REM Sleep and Dreaming" - doi:10.1038/nrn2716');
    console.warn('- Domhoff (2017): "Continuity Hypothesis" - doi:10.1037/drm0000047');
    console.warn('- Hobson (2009): "REM Sleep and Dreaming" - doi:10.1016/j.conb.2009.03.003\n');
    process.exit(0);
  }

  const validPapers = RESEARCH_PAPERS.filter(paper => {
    const fullPath = resolve(paper.path);
    const exists = existsSync(fullPath);
    
    if (!exists) {
      console.error(`❌ Not found: ${paper.path}`);
    } else {
      console.log(`✓ Found: ${paper.metadata.source}`);
    }
    
    return exists;
  });

  if (validPapers.length === 0) {
    console.error('\n❌ No valid PDF files found. Check paths in RESEARCH_PAPERS array.');
    process.exit(1);
  }

  console.log(`\nProcessing ${validPapers.length} papers...\n`);

  // Step 3: Process PDFs and extract chunks
  let totalChunks = 0;
  
  for (const paper of validPapers) {
    console.log(`\nProcessing: ${paper.metadata.source}`);
    console.log(`Category: ${paper.metadata.category}`);
    console.log(`Validation: ${paper.metadata.validation}`);
    
    try {
      // Process PDF into chunks
      const chunks = await documentProcessor.processPdf(
        resolve(paper.path),
        paper.metadata
      );
      
      if (chunks.length > 0) {
        // Add chunks to vector store
        await vectorStore.addDocuments(chunks);
        totalChunks += chunks.length;
        console.log(`✓ Added ${chunks.length} chunks to vector database`);
      } else {
        console.warn(`⚠️  No text extracted from ${paper.metadata.source}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to process ${paper.metadata.source}:`, error.message);
    }
  }

  // Step 4: Summary
  console.log('\n=== Ingestion Complete ===\n');
  console.log(`Papers processed: ${validPapers.length}`);
  console.log(`Total chunks added: ${totalChunks}`);
  console.log(`Average chunks per paper: ${Math.round(totalChunks / validPapers.length)}`);
  
  const finalCount = await vectorStore.getDocumentCount();
  console.log(`Total documents in database: ${finalCount}\n`);
  
  console.log('✓ Vector database ready for RAG-powered dream interpretation');
  console.log('✓ Citations will now come from real research papers\n');
}

// Run ingestion
ingestResearchPapers()
  .then(() => {
    console.log('Ingestion successful. Exiting.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Ingestion failed:', error);
    process.exit(1);
  });
