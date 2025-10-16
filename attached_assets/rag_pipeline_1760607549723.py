#!/usr/bin/env python3
"""
RAG Pipeline for Dream Interpretation
Combines retrieval from vector store with LLM generation
"""

import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import anthropic
from openai import OpenAI
from vector_store import VectorStoreManager

@dataclass
class RAGResponse:
    """Response from RAG pipeline"""
    interpretation: str
    confidence_score: float
    sources_used: List[Dict]
    reasoning: str
    alternative_interpretations: List[str]
    query: str

class RAGPipeline:
    """RAG pipeline for evidence-based dream interpretation"""

    def __init__(
        self,
        vector_store: VectorStoreManager,
        llm_provider: str = "anthropic",  # "anthropic" or "openai"
        model: str = None
    ):
        """
        Initialize RAG pipeline

        Args:
            vector_store: Initialized VectorStoreManager
            llm_provider: "anthropic" or "openai"
            model: Model name (optional, uses defaults)
        """
        self.vector_store = vector_store
        self.llm_provider = llm_provider

        # Initialize LLM client
        if llm_provider == "anthropic":
            self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            self.model = model or "claude-3-5-sonnet-20241022"
        elif llm_provider == "openai":
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            self.model = model or "gpt-4o-mini"
        else:
            raise ValueError(f"Unsupported LLM provider: {llm_provider}")

        print(f"RAG Pipeline initialized with {llm_provider} ({self.model})")

    def _build_dream_interpretation_prompt(
        self,
        dream_text: str,
        context: str,
        user_context: Optional[Dict] = None
    ) -> str:
        """
        Build prompt for dream interpretation

        Args:
            dream_text: The dream description
            context: Retrieved context from research
            user_context: Additional user context

        Returns:
            Formatted prompt
        """
        user_info = ""
        if user_context:
            stress = user_context.get("stress_level", "unknown")
            emotion = user_context.get("emotional_state", "unknown")
            events = user_context.get("recent_events", "none provided")

            user_info = f"""
USER CONTEXT:
- Stress Level: {stress}
- Emotional State: {emotion}
- Recent Events: {events}
"""

        prompt = f"""You are an expert dream analyst using evidence-based research to interpret dreams. You have access to scientific literature on dream analysis, including neuroscience studies, content analysis research, and psychological frameworks.

Your task is to interpret the following dream using ONLY the research context provided. Base your interpretation on scientific evidence and cite sources explicitly.

{user_info}

DREAM DESCRIPTION:
{dream_text}

RESEARCH CONTEXT:
{context}

INSTRUCTIONS:
1. Analyze the dream symbols and themes present in the dream
2. Reference specific research findings from the context
3. Provide an evidence-based interpretation citing sources
4. Assess confidence level (High: 80-100%, Medium: 50-79%, Low: 20-49%)
5. Offer 2-3 alternative interpretations if applicable
6. Explain your reasoning process

REQUIRED OUTPUT FORMAT:

PRIMARY INTERPRETATION:
[Provide main interpretation in 2-3 sentences]

CONFIDENCE LEVEL:
[High/Medium/Low] - [Percentage]%

SCIENTIFIC EVIDENCE:
[Cite specific research and findings from the provided context]

REASONING:
[Explain why this interpretation is most likely based on the research]

ALTERNATIVE INTERPRETATIONS:
1. [Alternative interpretation 1]
2. [Alternative interpretation 2]
3. [Alternative interpretation 3]

SOURCES CITED:
[List sources from context that supported your interpretation]

Remember: Only use information from the research context provided. Do not make up sources or cite research not present in the context."""

        return prompt

    def _parse_llm_response(self, response_text: str) -> Dict:
        """
        Parse LLM response into structured format

        Args:
            response_text: Raw LLM response

        Returns:
            Structured interpretation data
        """
        # Extract sections using markers
        sections = {
            "primary_interpretation": "",
            "confidence": "Medium - 50%",
            "scientific_evidence": "",
            "reasoning": "",
            "alternative_interpretations": [],
            "sources_cited": ""
        }

        current_section = None
        lines = response_text.split('\n')

        for line in lines:
            line_upper = line.strip().upper()

            if "PRIMARY INTERPRETATION:" in line_upper:
                current_section = "primary_interpretation"
                continue
            elif "CONFIDENCE LEVEL:" in line_upper or "CONFIDENCE:" in line_upper:
                current_section = "confidence"
                continue
            elif "SCIENTIFIC EVIDENCE:" in line_upper:
                current_section = "scientific_evidence"
                continue
            elif "REASONING:" in line_upper:
                current_section = "reasoning"
                continue
            elif "ALTERNATIVE INTERPRETATION" in line_upper:
                current_section = "alternative_interpretations"
                continue
            elif "SOURCES CITED:" in line_upper or "SOURCES:" in line_upper:
                current_section = "sources_cited"
                continue

            # Add content to current section
            if current_section and line.strip():
                if current_section == "alternative_interpretations":
                    # Parse numbered list
                    if line.strip()[0:2] in ['1.', '2.', '3.', '4.', '5.']:
                        sections[current_section].append(line.strip()[3:].strip())
                elif isinstance(sections[current_section], str):
                    sections[current_section] += line.strip() + " "

        # Clean up sections
        for key in sections:
            if isinstance(sections[key], str):
                sections[key] = sections[key].strip()

        # Extract confidence score
        confidence_text = sections["confidence"]
        confidence_score = 0.5  # Default

        if "%" in confidence_text:
            try:
                # Extract percentage
                import re
                match = re.search(r'(\d+)%', confidence_text)
                if match:
                    confidence_score = int(match.group(1)) / 100
            except:
                pass
        elif "High" in confidence_text:
            confidence_score = 0.85
        elif "Low" in confidence_text:
            confidence_score = 0.35

        sections["confidence_score"] = confidence_score

        return sections

    def interpret_dream(
        self,
        dream_text: str,
        user_context: Optional[Dict] = None,
        n_sources: int = 5
    ) -> RAGResponse:
        """
        Interpret dream using RAG pipeline

        Args:
            dream_text: Dream description
            user_context: Additional user context
            n_sources: Number of source documents to retrieve

        Returns:
            RAGResponse with interpretation
        """
        # Step 1: Retrieve relevant research
        print(f"Retrieving relevant research...")
        context, source_docs = self.vector_store.get_context_for_query(
            dream_text,
            max_tokens=3000,
            n_results=n_sources
        )

        print(f"Retrieved {len(source_docs)} relevant document chunks")

        # Step 2: Build prompt
        prompt = self._build_dream_interpretation_prompt(
            dream_text,
            context,
            user_context
        )

        # Step 3: Generate interpretation with LLM
        print(f"Generating interpretation with {self.llm_provider}...")

        if self.llm_provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            response_text = response.content[0].text

        elif self.llm_provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are an expert dream analyst using evidence-based research."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                max_tokens=2000
            )
            response_text = response.choices[0].message.content

        # Step 4: Parse response
        parsed = self._parse_llm_response(response_text)

        # Step 5: Format sources
        sources_formatted = []
        for doc in source_docs:
            sources_formatted.append({
                "source": doc['metadata'].get('source', 'Unknown'),
                "category": doc['metadata'].get('category', 'general'),
                "relevance": doc['relevance_score'],
                "excerpt": doc['content'][:200] + "..."
            })

        # Create response object
        rag_response = RAGResponse(
            interpretation=parsed["primary_interpretation"],
            confidence_score=parsed["confidence_score"],
            sources_used=sources_formatted,
            reasoning=parsed["reasoning"],
            alternative_interpretations=parsed["alternative_interpretations"],
            query=dream_text
        )

        return rag_response

    def interpret_with_followup(
        self,
        dream_text: str,
        followup_question: str,
        previous_context: str,
        user_context: Optional[Dict] = None
    ) -> RAGResponse:
        """
        Handle follow-up questions about a dream interpretation

        Args:
            dream_text: Original dream
            followup_question: Follow-up question
            previous_context: Previous interpretation context
            user_context: User context

        Returns:
            RAGResponse with follow-up answer
        """
        # Retrieve relevant research for follow-up
        combined_query = f"{dream_text} {followup_question}"
        context, source_docs = self.vector_store.get_context_for_query(
            combined_query,
            max_tokens=2000,
            n_results=3
        )

        # Build follow-up prompt
        prompt = f"""You previously analyzed this dream:

DREAM: {dream_text}

PREVIOUS INTERPRETATION CONTEXT:
{previous_context}

The user has a follow-up question:
QUESTION: {followup_question}

ADDITIONAL RESEARCH CONTEXT:
{context}

Please answer the follow-up question based on the research context provided. Be specific and cite sources."""

        # Generate response
        if self.llm_provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            response_text = response.content[0].text
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                max_tokens=1500
            )
            response_text = response.choices[0].message.content

        # Simple response format for follow-ups
        sources_formatted = [{
            "source": doc['metadata'].get('source', 'Unknown'),
            "relevance": doc['relevance_score']
        } for doc in source_docs]

        return RAGResponse(
            interpretation=response_text,
            confidence_score=0.75,
            sources_used=sources_formatted,
            reasoning="Follow-up response",
            alternative_interpretations=[],
            query=followup_question
        )

def test_rag_pipeline():
    """Test the RAG pipeline"""
    print("=" * 80)
    print("Testing RAG Pipeline")
    print("=" * 80)

    # Initialize vector store
    print("\n1. Loading vector store...")
    vector_store = VectorStoreManager(
        collection_name="dream_research",
        embedding_provider="huggingface"
    )

    # Check if we need API keys
    llm_provider = "anthropic"
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("\nWarning: ANTHROPIC_API_KEY not found")
        if os.getenv("OPENAI_API_KEY"):
            llm_provider = "openai"
            print("Using OpenAI instead")
        else:
            print("Error: No LLM API key found. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY")
            return

    # Initialize RAG pipeline
    print(f"\n2. Initializing RAG pipeline with {llm_provider}...")
    rag = RAGPipeline(vector_store, llm_provider=llm_provider)

    # Test dream
    test_dream = """I had a dream where my teeth were falling out one by one.
    I was at work and trying to catch them as they fell. I felt panicked and embarrassed.
    Everyone around me seemed to be staring."""

    user_context = {
        "stress_level": "high",
        "emotional_state": "anxious",
        "recent_events": "Big presentation at work coming up"
    }

    print("\n3. Interpreting dream...")
    print(f"\nDream: {test_dream}")
    print(f"Context: {user_context}")

    # Get interpretation
    response = rag.interpret_dream(test_dream, user_context, n_sources=5)

    # Display results
    print("\n" + "=" * 80)
    print("INTERPRETATION RESULTS")
    print("=" * 80)

    print(f"\nPRIMARY INTERPRETATION:")
    print(response.interpretation)

    print(f"\nCONFIDENCE: {response.confidence_score*100:.0f}%")

    print(f"\nREASONING:")
    print(response.reasoning)

    if response.alternative_interpretations:
        print(f"\nALTERNATIVE INTERPRETATIONS:")
        for idx, alt in enumerate(response.alternative_interpretations, 1):
            print(f"{idx}. {alt}")

    print(f"\nSOURCES USED ({len(response.sources_used)}):")
    for idx, source in enumerate(response.sources_used[:3], 1):
        print(f"{idx}. {source['source']} (Relevance: {source['relevance']:.2f})")

    print("\n" + "=" * 80)
    print("RAG Pipeline test complete!")
    print("=" * 80)

    return rag, response

def main():
    """Main function"""
    test_rag_pipeline()

if __name__ == "__main__":
    main()
