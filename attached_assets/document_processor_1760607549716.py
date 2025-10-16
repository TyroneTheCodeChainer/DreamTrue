#!/usr/bin/env python3
"""
Document Processing Pipeline for RAG System
Processes research PDFs, chunks them, and prepares for embedding
"""

import os
import re
from pathlib import Path
from typing import List, Dict
from dataclasses import dataclass
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document as LangchainDocument

@dataclass
class ProcessedDocument:
    """Represents a processed document chunk"""
    content: str
    metadata: Dict
    doc_id: str
    chunk_id: int

class DocumentProcessor:
    """Processes research documents for RAG pipeline"""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ):
        """
        Initialize document processor with chunking strategy optimized for RAG

        Args:
            chunk_size: Size of each text chunk in characters (default 1000)
                       - Balances context preservation with retrieval precision
                       - Larger chunks: more context but less focused retrieval
                       - Smaller chunks: more focused but may lose context
            chunk_overlap: Overlap between chunks for context preservation (default 200)
                          - Prevents information loss at chunk boundaries
                          - Ensures sentences/ideas aren't split awkwardly
            separators: Custom separators for chunking (optional)
                       - If None, uses hierarchical separators optimized for academic papers
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Default separators optimized for academic papers
        # Hierarchical approach: try to split on larger units first (paragraphs),
        # then fall back to smaller units (sentences, words, characters)
        if separators is None:
            separators = [
                "\n\n",  # Paragraph breaks - preserve paragraph structure
                "\n",    # Line breaks - keep related sentences together
                ". ",    # Sentence endings - maintain sentence integrity
                "! ",    # Exclamation sentences
                "? ",    # Question sentences
                "; ",    # Semicolons - preserve complex sentence structure
                ", ",    # Commas - keep clauses together when possible
                " ",     # Spaces - word boundaries (last resort)
                ""       # Characters - absolute last resort
            ]

        # Initialize LangChain's RecursiveCharacterTextSplitter
        # This splitter tries each separator in order until chunk_size is achieved
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=separators,
            length_function=len  # Use character count for length
        )

        # Store all processed documents for later reference
        self.processed_docs: List[ProcessedDocument] = []

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text content from PDF file using PyPDF2

        Args:
            pdf_path: Absolute or relative path to PDF file

        Returns:
            Extracted text content as a single string, or empty string on error

        Note:
            - Pages are separated by double newlines to preserve document structure
            - Text is cleaned to remove PDF artifacts and normalize whitespace
            - Empty pages are skipped automatically
        """
        try:
            # Open PDF in binary read mode
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = []

                # Extract text from each page
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()

                    # Skip empty pages (some PDFs have blank pages)
                    if page_text:
                        # Clean up extracted text (remove artifacts, normalize spacing)
                        page_text = self._clean_text(page_text)
                        text.append(page_text)

                # Join pages with double newlines to preserve document structure
                return "\n\n".join(text)

        except Exception as e:
            # Log error and return empty string rather than crashing
            # This allows batch processing to continue even if one PDF fails
            print(f"Error extracting text from {pdf_path}: {e}")
            return ""

    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text by removing PDF artifacts and normalizing whitespace

        Args:
            text: Raw text extracted from PDF

        Returns:
            Cleaned text ready for chunking

        Cleaning steps:
            1. Collapse multiple whitespace characters into single spaces
            2. Remove standalone page numbers
            3. Remove non-ASCII characters (PDF encoding artifacts)
            4. Strip leading/trailing whitespace
        """
        # Remove excessive whitespace (multiple spaces, tabs, newlines -> single space)
        # This normalizes spacing that can be irregular in PDF extraction
        text = re.sub(r'\s+', ' ', text)

        # Remove page numbers (simple pattern: newline-digits-newline)
        # Prevents page numbers from appearing mid-sentence in chunks
        text = re.sub(r'\n\d+\n', '\n', text)

        # Remove common PDF artifacts (non-ASCII characters)
        # PDFs often contain encoding artifacts that aren't meaningful text
        # ASCII range is \x00-\x7F (0-127 in decimal)
        text = re.sub(r'[^\x00-\x7F]+', ' ', text)

        # Normalize whitespace: remove leading/trailing spaces
        text = text.strip()

        return text

    def process_pdf(self, pdf_path: str, metadata: Dict = None) -> List[ProcessedDocument]:
        """
        Process a PDF file into chunks with metadata

        This is the main processing function that:
        1. Extracts text from PDF
        2. Splits text into chunks using RecursiveCharacterTextSplitter
        3. Attaches metadata to each chunk (for filtering/ranking during retrieval)
        4. Returns list of ProcessedDocument objects ready for embedding

        Args:
            pdf_path: Path to PDF file (absolute or relative)
            metadata: Optional metadata dictionary to attach to all chunks
                     Example: {"title": "Paper Title", "author": "Author Name", "category": "neuroscience"}

        Returns:
            List of ProcessedDocument objects, each representing one chunk
            Returns empty list if PDF extraction fails

        Note:
            All chunks from this PDF are also stored in self.processed_docs for batch access
        """
        # Step 1: Extract text from PDF
        text = self.extract_text_from_pdf(pdf_path)

        # If extraction failed (e.g., corrupted PDF), return empty list
        if not text:
            return []

        # Step 2: Get file metadata from path
        file_name = Path(pdf_path).name  # e.g., "paper.pdf"
        doc_id = Path(pdf_path).stem     # e.g., "paper" (filename without extension)

        # Step 3: Create default metadata for this document
        doc_metadata = {
            "source": file_name,           # Filename for citation
            "doc_id": doc_id,              # Unique document ID
            "file_path": pdf_path,         # Full path (for debugging)
            "document_type": "research_paper"  # Document category
        }

        # Step 4: Merge with provided metadata (if any)
        # Provided metadata will override defaults if keys match
        if metadata:
            doc_metadata.update(metadata)

        # Step 5: Split text into chunks using configured text splitter
        # This uses the RecursiveCharacterTextSplitter configured in __init__
        chunks = self.text_splitter.split_text(text)

        # Step 6: Create ProcessedDocument objects with metadata
        processed_chunks = []
        for chunk_idx, chunk in enumerate(chunks):
            # Create a copy of metadata for this specific chunk
            chunk_metadata = doc_metadata.copy()

            # Add chunk-specific metadata
            chunk_metadata["chunk_id"] = chunk_idx             # Position within document
            chunk_metadata["total_chunks"] = len(chunks)       # Total chunks in document

            # Create ProcessedDocument object
            processed_doc = ProcessedDocument(
                content=chunk,              # The actual text content
                metadata=chunk_metadata,    # All metadata for this chunk
                doc_id=doc_id,             # Document identifier
                chunk_id=chunk_idx         # Chunk position
            )
            processed_chunks.append(processed_doc)

        # Step 7: Store in class variable for batch access later
        self.processed_docs.extend(processed_chunks)

        return processed_chunks

    def process_directory(self, directory_path: str, metadata_map: Dict[str, Dict] = None) -> List[ProcessedDocument]:
        """
        Process all PDFs in a directory

        Args:
            directory_path: Path to directory containing PDFs
            metadata_map: Optional mapping of filenames to metadata

        Returns:
            List of all processed document chunks
        """
        all_chunks = []

        # Find all PDF files
        pdf_files = list(Path(directory_path).glob("*.pdf"))

        print(f"Found {len(pdf_files)} PDF files in {directory_path}")

        for pdf_file in pdf_files:
            print(f"Processing: {pdf_file.name}")

            # Get metadata for this file
            file_metadata = None
            if metadata_map and pdf_file.name in metadata_map:
                file_metadata = metadata_map[pdf_file.name]

            # Process the PDF
            chunks = self.process_pdf(str(pdf_file), file_metadata)
            all_chunks.extend(chunks)

            print(f"  -> Generated {len(chunks)} chunks")

        return all_chunks

    def get_langchain_documents(self) -> List[LangchainDocument]:
        """
        Convert processed documents to LangChain Document format

        Returns:
            List of LangChain Document objects
        """
        return [
            LangchainDocument(
                page_content=doc.content,
                metadata=doc.metadata
            )
            for doc in self.processed_docs
        ]

    def save_chunks_to_text(self, output_path: str):
        """
        Save processed chunks to a text file for inspection

        Args:
            output_path: Path to output text file
        """
        with open(output_path, 'w', encoding='utf-8') as f:
            for doc in self.processed_docs:
                f.write(f"\n{'='*80}\n")
                f.write(f"Document: {doc.metadata['source']}\n")
                f.write(f"Chunk: {doc.chunk_id + 1}/{doc.metadata['total_chunks']}\n")
                f.write(f"{'='*80}\n\n")
                f.write(doc.content)
                f.write(f"\n\n")

        print(f"Saved {len(self.processed_docs)} chunks to {output_path}")

def create_research_metadata_map() -> Dict[str, Dict]:
    """
    Create metadata mapping for dream research papers

    Returns:
        Dictionary mapping filenames to metadata
    """
    return {
        "fpsyg-12-718372 (1).pdf": {
            "title": "The Neuropsychology of Dreams",
            "author": "Mark Solms",
            "category": "neuroscience",
            "weight": 0.215,
            "validation": "High - Brain imaging studies"
        },
        "fpsyg-12-718372 (2).pdf": {
            "title": "The Neuropsychology of Dreams",
            "author": "Mark Solms",
            "category": "neuroscience",
            "weight": 0.215,
            "validation": "High - Brain imaging studies"
        },
        "book-review-the-content-analysis-of-dreams-hall-van-de-castle.pdf": {
            "title": "The Content Analysis of Dreams - Hall & Van de Castle",
            "author": "Hall & Van de Castle",
            "category": "content_analysis",
            "weight": 0.184,
            "validation": "High - 20,000+ coded dreams"
        },
        "474-Article Text-2073-2-10-20100422.pdf": {
            "title": "Dream Research and Clinical Practice",
            "author": "Various",
            "category": "clinical",
            "weight": 0.153,
            "validation": "High - Clinical studies"
        },
        "474-Article Text-2073-2-10-20100422 (1).pdf": {
            "title": "Dream Research and Clinical Practice",
            "author": "Various",
            "category": "clinical",
            "weight": 0.153,
            "validation": "High - Clinical studies"
        },
        "fpsyg-11-585702 (1).pdf": {
            "title": "Contemporary Dream Research",
            "author": "Various",
            "category": "contemporary",
            "weight": 0.123,
            "validation": "Moderate - Contemporary studies"
        },
        "fpsyg-11-585702 (2).pdf": {
            "title": "Contemporary Dream Research",
            "author": "Various",
            "category": "contemporary",
            "weight": 0.123,
            "validation": "Moderate - Contemporary studies"
        }
    }

def main():
    """Test document processing pipeline"""
    print("Dream Interpreter - Document Processing Pipeline")
    print("=" * 60)

    # Initialize processor
    processor = DocumentProcessor(
        chunk_size=1000,
        chunk_overlap=200
    )

    # Set up paths
    base_path = Path(__file__).parent.parent
    research_dir = base_path / "Resources and References"

    print(f"\nProcessing documents from: {research_dir}")

    # Create metadata map
    metadata_map = create_research_metadata_map()

    # Process all documents
    chunks = processor.process_directory(str(research_dir), metadata_map)

    print(f"\n{'='*60}")
    print(f"Processing Complete!")
    print(f"Total documents processed: {len(set(doc.doc_id for doc in chunks))}")
    print(f"Total chunks generated: {len(chunks)}")
    print(f"Average chunk size: {sum(len(doc.content) for doc in chunks) / len(chunks):.0f} characters")

    # Save chunks for inspection
    output_file = base_path / "processed_chunks.txt"
    processor.save_chunks_to_text(str(output_file))

    # Show sample chunk
    if chunks:
        print(f"\n{'='*60}")
        print("Sample Chunk:")
        print(f"{'='*60}")
        sample = chunks[0]
        print(f"Source: {sample.metadata['source']}")
        print(f"Category: {sample.metadata.get('category', 'N/A')}")
        print(f"Chunk: {sample.chunk_id + 1}/{sample.metadata['total_chunks']}")
        print(f"\nContent Preview:\n{sample.content[:300]}...")

if __name__ == "__main__":
    main()
