#!/usr/bin/env python3
"""
Agentic Dream Interpretation System using LangGraph
Multi-agent workflow for comprehensive dream analysis
"""

import os
from typing import Dict, List, TypedDict, Annotated, Literal
from dataclasses import dataclass
import operator
from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from vector_store import VectorStoreManager

# State definition for agent workflow
class DreamAnalysisState(TypedDict):
    """State for dream analysis agent workflow"""
    dream_text: str
    user_context: Dict
    dream_symbols: List[str]
    research_context: str
    retrieved_sources: List[Dict]
    symbol_analysis: str
    psychological_analysis: str
    cultural_analysis: str
    final_interpretation: str
    confidence_score: float
    reasoning: str
    alternative_interpretations: List[str]
    current_step: str
    messages: Annotated[List[str], operator.add]

@dataclass
class AgenticResponse:
    """Response from agentic system"""
    interpretation: str
    confidence_score: float
    symbol_analysis: str
    psychological_analysis: str
    cultural_analysis: str
    reasoning: str
    alternative_interpretations: List[str]
    sources_used: List[Dict]
    agent_trace: List[str]

class DreamInterpreterAgents:
    """Multi-agent system for dream interpretation"""

    def __init__(
        self,
        vector_store: VectorStoreManager,
        llm_provider: str = "anthropic",
        model: str = None
    ):
        """
        Initialize agentic system

        Args:
            vector_store: Vector store for research retrieval
            llm_provider: "anthropic" or "openai"
            model: Model name
        """
        self.vector_store = vector_store
        self.llm_provider = llm_provider

        # Initialize LLM
        if llm_provider == "anthropic":
            self.llm = ChatAnthropic(
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                model=model or "claude-3-5-sonnet-20241022",
                temperature=0.3
            )
        elif llm_provider == "openai":
            self.llm = ChatOpenAI(
                openai_api_key=os.getenv("OPENAI_API_KEY"),
                model=model or "gpt-4o-mini",
                temperature=0.3
            )

        # Build workflow graph
        self.workflow = self._build_workflow()

        print(f"Agentic system initialized with {llm_provider}")

    def _build_workflow(self) -> StateGraph:
        """Build LangGraph workflow"""
        workflow = StateGraph(DreamAnalysisState)

        # Add nodes (agents)
        workflow.add_node("symbol_extractor", self.extract_symbols_agent)
        workflow.add_node("research_retriever", self.retrieve_research_agent)
        workflow.add_node("symbol_analyzer", self.analyze_symbols_agent)
        workflow.add_node("psychological_analyzer", self.psychological_analysis_agent)
        workflow.add_node("cultural_analyzer", self.cultural_analysis_agent)
        workflow.add_node("synthesis_agent", self.synthesis_agent)

        # Define workflow edges
        workflow.set_entry_point("symbol_extractor")
        workflow.add_edge("symbol_extractor", "research_retriever")
        workflow.add_edge("research_retriever", "symbol_analyzer")
        workflow.add_edge("symbol_analyzer", "psychological_analyzer")
        workflow.add_edge("psychological_analyzer", "cultural_analyzer")
        workflow.add_edge("cultural_analyzer", "synthesis_agent")
        workflow.add_edge("synthesis_agent", END)

        return workflow.compile()

    def extract_symbols_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 1: Extract dream symbols"""
        print("Agent 1: Extracting dream symbols...")

        prompt = f"""Analyze this dream and extract the key symbols, themes, and elements.

Dream: {state['dream_text']}

List the most important symbols (5-10) that should be researched. Output as a comma-separated list.
Focus on: objects, actions, emotions, people, places, colors, animals.

Example output: "teeth falling out, workplace, panic, embarrassment, falling"
"""

        messages = [
            SystemMessage(content="You are a dream symbol extraction expert."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        symbols_text = response.content

        # Parse symbols
        symbols = [s.strip() for s in symbols_text.split(',')]

        state['dream_symbols'] = symbols
        state['current_step'] = "symbol_extraction"
        state['messages'].append(f"Extracted {len(symbols)} symbols")

        print(f"  -> Extracted symbols: {', '.join(symbols[:5])}...")

        return state

    def retrieve_research_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 2: Retrieve relevant research"""
        print("Agent 2: Retrieving research from vector database...")

        # Build search query from dream and symbols
        search_query = f"{state['dream_text']} {' '.join(state['dream_symbols'][:5])}"

        # Retrieve research
        context, sources = self.vector_store.get_context_for_query(
            search_query,
            max_tokens=4000,
            n_results=7
        )

        state['research_context'] = context
        state['retrieved_sources'] = sources
        state['current_step'] = "research_retrieval"
        state['messages'].append(f"Retrieved {len(sources)} research sources")

        print(f"  -> Retrieved {len(sources)} relevant research sources")

        return state

    def analyze_symbols_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 3: Analyze symbols using research"""
        print("Agent 3: Analyzing dream symbols...")

        prompt = f"""You are a dream symbol analyst. Analyze the following symbols from a dream using the research context provided.

Dream: {state['dream_text']}
Symbols: {', '.join(state['dream_symbols'])}

Research Context:
{state['research_context'][:3000]}

For each major symbol, explain:
1. What it represents based on research
2. Scientific evidence supporting this interpretation
3. Common patterns in dream research

Be specific and cite sources from the research context."""

        messages = [
            SystemMessage(content="You are a scientific dream symbol analyst."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        state['symbol_analysis'] = response.content
        state['current_step'] = "symbol_analysis"
        state['messages'].append("Completed symbol analysis")

        print("  -> Symbol analysis complete")

        return state

    def psychological_analysis_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 4: Psychological framework analysis"""
        print("Agent 4: Performing psychological analysis...")

        user_context_str = ""
        if state.get('user_context'):
            ctx = state['user_context']
            user_context_str = f"""
User Context:
- Stress Level: {ctx.get('stress_level', 'unknown')}
- Emotional State: {ctx.get('emotional_state', 'unknown')}
- Recent Events: {ctx.get('recent_events', 'none')}
"""

        prompt = f"""You are a psychological dream analyst. Analyze this dream from psychological perspectives.

Dream: {state['dream_text']}
{user_context_str}

Previous Symbol Analysis:
{state['symbol_analysis'][:1500]}

Research Context (focus on psychological studies):
{state['research_context'][:2000]}

Analyze from these perspectives:
1. Emotional processing and mood regulation
2. Memory consolidation and personal experiences
3. Threat simulation and evolutionary psychology
4. Personal psychological state and stress response

Connect the dream to the user's current context if provided."""

        messages = [
            SystemMessage(content="You are a psychological dream analyst with expertise in contemporary dream research."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        state['psychological_analysis'] = response.content
        state['current_step'] = "psychological_analysis"
        state['messages'].append("Completed psychological analysis")

        print("  -> Psychological analysis complete")

        return state

    def cultural_analysis_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 5: Cultural and archetypal analysis"""
        print("Agent 5: Performing cultural analysis...")

        prompt = f"""You are a cultural dream analyst. Provide cultural and archetypal context for this dream.

Dream: {state['dream_text']}
Symbols: {', '.join(state['dream_symbols'])}

Research Context (focus on cultural studies):
{state['research_context'][:2000]}

Analyze:
1. Cross-cultural patterns and universal themes
2. Archetypal meanings (if supported by research)
3. Cultural variations in interpretation
4. Traditional vs modern perspectives

Stay grounded in the research provided."""

        messages = [
            SystemMessage(content="You are a cultural dream analyst specializing in cross-cultural dream patterns."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        state['cultural_analysis'] = response.content
        state['current_step'] = "cultural_analysis"
        state['messages'].append("Completed cultural analysis")

        print("  -> Cultural analysis complete")

        return state

    def synthesis_agent(self, state: DreamAnalysisState) -> DreamAnalysisState:
        """Agent 6: Synthesize all analyses into final interpretation"""
        print("Agent 6: Synthesizing final interpretation...")

        prompt = f"""You are the synthesis agent. Combine all previous analyses into a comprehensive, coherent dream interpretation.

Dream: {state['dream_text']}

SYMBOL ANALYSIS:
{state['symbol_analysis']}

PSYCHOLOGICAL ANALYSIS:
{state['psychological_analysis']}

CULTURAL ANALYSIS:
{state['cultural_analysis']}

Create a final interpretation that:
1. Integrates insights from all analyses
2. Prioritizes scientific evidence over speculation
3. Provides actionable insights for the dreamer
4. Includes confidence assessment (High/Medium/Low with %)
5. Offers 2-3 alternative interpretations
6. Explains reasoning clearly

OUTPUT FORMAT:

FINAL INTERPRETATION:
[2-3 paragraphs integrating all perspectives]

CONFIDENCE:
[High/Medium/Low] - [XX]%

REASONING:
[Explain why this interpretation is most supported]

ALTERNATIVE INTERPRETATIONS:
1. [Alternative 1]
2. [Alternative 2]
3. [Alternative 3]

KEY INSIGHTS:
[Practical takeaways for the dreamer]
"""

        messages = [
            SystemMessage(content="You are the synthesis agent responsible for creating the final comprehensive dream interpretation."),
            HumanMessage(content=prompt)
        ]

        response = self.llm.invoke(messages)
        synthesis = response.content

        # Parse synthesis response
        state['final_interpretation'] = synthesis

        # Extract confidence score
        confidence = 0.7  # Default
        if "High" in synthesis and "%" in synthesis:
            confidence = 0.85
        elif "Low" in synthesis and "%" in synthesis:
            confidence = 0.4

        state['confidence_score'] = confidence

        # Extract alternatives (simplified)
        alternatives = []
        lines = synthesis.split('\n')
        in_alternatives = False
        for line in lines:
            if "ALTERNATIVE INTERPRETATION" in line.upper():
                in_alternatives = True
                continue
            if in_alternatives and line.strip() and line.strip()[0] in '123456789':
                alternatives.append(line.strip()[3:])

        state['alternative_interpretations'] = alternatives[:3]

        # Extract reasoning
        reasoning_start = synthesis.find("REASONING:")
        reasoning_end = synthesis.find("ALTERNATIVE INTERPRETATIONS:")
        if reasoning_start != -1 and reasoning_end != -1:
            state['reasoning'] = synthesis[reasoning_start:reasoning_end].replace("REASONING:", "").strip()
        else:
            state['reasoning'] = "Synthesized from multiple analytical perspectives"

        state['current_step'] = "complete"
        state['messages'].append("Synthesis complete")

        print("  -> Final interpretation synthesized")

        return state

    def interpret_dream(
        self,
        dream_text: str,
        user_context: Dict = None
    ) -> AgenticResponse:
        """
        Interpret dream using multi-agent system

        Args:
            dream_text: Dream description
            user_context: User context information

        Returns:
            AgenticResponse with complete analysis
        """
        print("\n" + "=" * 80)
        print("AGENTIC DREAM INTERPRETATION SYSTEM")
        print("=" * 80 + "\n")

        # Initialize state
        initial_state = DreamAnalysisState(
            dream_text=dream_text,
            user_context=user_context or {},
            dream_symbols=[],
            research_context="",
            retrieved_sources=[],
            symbol_analysis="",
            psychological_analysis="",
            cultural_analysis="",
            final_interpretation="",
            confidence_score=0.0,
            reasoning="",
            alternative_interpretations=[],
            current_step="start",
            messages=[]
        )

        # Run workflow
        final_state = self.workflow.invoke(initial_state)

        # Create response
        response = AgenticResponse(
            interpretation=final_state['final_interpretation'],
            confidence_score=final_state['confidence_score'],
            symbol_analysis=final_state['symbol_analysis'],
            psychological_analysis=final_state['psychological_analysis'],
            cultural_analysis=final_state['cultural_analysis'],
            reasoning=final_state['reasoning'],
            alternative_interpretations=final_state['alternative_interpretations'],
            sources_used=final_state['retrieved_sources'],
            agent_trace=final_state['messages']
        )

        print("\n" + "=" * 80)
        print("AGENTIC ANALYSIS COMPLETE")
        print("=" * 80)

        return response

def test_agentic_system():
    """Test the agentic interpretation system"""
    print("Testing Agentic Dream Interpretation System")
    print("=" * 80)

    # Initialize vector store
    print("\n1. Loading vector store...")
    vector_store = VectorStoreManager(
        collection_name="dream_research",
        embedding_provider="huggingface"
    )

    # Check API keys
    llm_provider = "anthropic"
    if not os.getenv("ANTHROPIC_API_KEY"):
        if os.getenv("OPENAI_API_KEY"):
            llm_provider = "openai"
        else:
            print("Error: No LLM API key found")
            return

    # Initialize agentic system
    print(f"\n2. Initializing agentic system...")
    agents = DreamInterpreterAgents(vector_store, llm_provider=llm_provider)

    # Test dream
    test_dream = """Last night I dreamed I was flying over a vast ocean. The water below
    was crystal clear and I could see colorful fish swimming. Suddenly, I started losing
    altitude and falling toward the water. I felt scared but also exhilarated. Just before
    hitting the water, I woke up."""

    user_context = {
        "stress_level": "medium",
        "emotional_state": "excited",
        "recent_events": "Starting a new job next week"
    }

    print("\n3. Interpreting dream with agentic workflow...")
    print(f"\nDream: {test_dream}")

    # Run interpretation
    response = agents.interpret_dream(test_dream, user_context)

    # Display results
    print("\n" + "=" * 80)
    print("AGENTIC INTERPRETATION RESULTS")
    print("=" * 80)

    print(f"\nFINAL INTERPRETATION:")
    print(response.interpretation)

    print(f"\n\nCONFIDENCE: {response.confidence_score*100:.0f}%")

    print(f"\n\nSOURCES USED: {len(response.sources_used)}")
    for idx, source in enumerate(response.sources_used[:3], 1):
        print(f"  {idx}. {source['metadata'].get('source', 'Unknown')} "
              f"(Relevance: {source['relevance_score']:.2f})")

    print(f"\n\nAGENT WORKFLOW TRACE:")
    for message in response.agent_trace:
        print(f"  ✓ {message}")

    return agents, response

def main():
    """Main function"""
    test_agentic_system()

if __name__ == "__main__":
    main()
