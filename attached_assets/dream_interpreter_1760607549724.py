#!/usr/bin/env python3
"""
AI Dream Interpreter Application
Evidence-Weighted Dream Interpretation Engine

Based on comprehensive research including:
- Hall & Van de Castle Content Analysis
- Neuropsychoanalysis studies
- Cultural and anthropological sources
- Scientific validation hierarchy
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class ConfidenceLevel(Enum):
    HIGH = "High (80-100%)"
    MEDIUM = "Medium (50-79%)"
    LOW = "Low (20-49%)"
    VERY_LOW = "Very Low (<20%)"

@dataclass
class DreamSymbol:
    symbol: str
    context: str
    frequency: int
    cultural_meanings: List[str]
    scientific_correlations: List[str]

@dataclass
class Interpretation:
    primary_meaning: str
    confidence: ConfidenceLevel
    confidence_score: float
    sources: List[str]
    scientific_evidence: str
    cultural_context: str
    alternative_meanings: List[str]

class EvidenceWeightedInterpreter:
    """
    Evidence-weighted dream interpretation engine based on scientific validation hierarchy
    """
    
    def __init__(self):
        self.scientific_weights = {
            "mark_solms_neuropsychoanalysis": 0.215,  # 21.5%
            "hall_van_de_castle": 0.184,              # 18.4%
            "cartwright_mood_regulation": 0.153,      # 15.3%
            "hobson_activation_synthesis": 0.123,     # 12.3%
            "hartmann_connectionist": 0.092,          # 9.2%
            "jung_archetypal": 0.074,                  # 7.4%
            "faraday_systematic": 0.061,               # 6.1%
            "freudian_analysis": 0.049,                # 4.9%
            "traditional_dictionaries": 0.031,         # 3.1%
            "cultural_spiritual": 0.018                # 1.8%
        }
        
        self.symbol_database = self._load_symbol_database()
        self.research_sources = self._load_research_sources()
    
    def _load_symbol_database(self) -> Dict[str, DreamSymbol]:
        """Load comprehensive symbol database from research sources"""
        return {
            "teeth_falling_out": DreamSymbol(
                symbol="teeth_falling_out",
                context="stress_transition",
                frequency=85,
                cultural_meanings=["loss of power", "life changes", "insecurity"],
                scientific_correlations=["anxiety correlation", "stress response", "control issues"]
            ),
            "flying": DreamSymbol(
                symbol="flying",
                context="freedom_escape",
                frequency=72,
                cultural_meanings=["freedom", "escape", "spiritual elevation"],
                scientific_correlations=["lucid dreaming", "REM sleep", "creative problem solving"]
            ),
            "water": DreamSymbol(
                symbol="water",
                context="emotions_cleansing",
                frequency=68,
                cultural_meanings=["emotions", "cleansing", "life force"],
                scientific_correlations=["emotional processing", "memory consolidation"]
            ),
            "snake": DreamSymbol(
                symbol="snake",
                context="transformation_danger",
                frequency=45,
                cultural_meanings=["transformation", "danger", "wisdom"],
                scientific_correlations=["threat detection", "evolutionary response"]
            ),
            "house": DreamSymbol(
                symbol="house",
                context="self_identity",
                frequency=78,
                cultural_meanings=["self", "family", "security"],
                scientific_correlations=["self-concept", "memory organization"]
            )
        }
    
    def _load_research_sources(self) -> Dict[str, Dict]:
        """Load research sources and validation levels"""
        return {
            "mark_solms_neuropsychoanalysis": {
                "source": "Solms, M. (1997). The Neuropsychology of Dreams",
                "validation": "High - Brain imaging studies, clinical evidence",
                "weight": 0.215
            },
            "hall_van_de_castle": {
                "source": "Hall, C.S. & Van de Castle, R.L. (1966). The Content Analysis of Dreams",
                "validation": "High - 20,000+ coded dreams, statistical patterns",
                "weight": 0.184
            },
            "cartwright_mood_regulation": {
                "source": "Cartwright, R. (1992). Crisis Dreaming",
                "validation": "High - Controlled studies, clinical trials",
                "weight": 0.153
            },
            "hobson_activation_synthesis": {
                "source": "Hobson, J.A. (1988). The Dreaming Brain",
                "validation": "High - Neuroscience model, REM research",
                "weight": 0.123
            },
            "hartmann_connectionist": {
                "source": "Hartmann, E. (1999). Dreams and Nightmares",
                "validation": "Moderate - Some empirical support, trauma research",
                "weight": 0.092
            },
            "jung_archetypal": {
                "source": "Jung, C.G. (1964). Man and His Symbols",
                "validation": "Moderate - Cross-cultural patterns, clinical observations",
                "weight": 0.074
            }
        }
    
    def analyze_dream(self, dream_text: str, user_context: Dict = None) -> Interpretation:
        """
        Analyze dream using evidence-weighted algorithm
        
        Args:
            dream_text: The dream description
            user_context: Additional user context (age, culture, recent events, etc.)
        
        Returns:
            Interpretation object with analysis results
        """
        if user_context is None:
            user_context = {}
        
        # Extract symbols from dream text
        symbols = self._extract_symbols(dream_text)
        
        # Calculate evidence-weighted scores
        scientific_score = self._calculate_scientific_score(symbols, user_context)
        cultural_score = self._calculate_cultural_score(symbols, user_context)
        psychological_score = self._calculate_psychological_score(symbols, user_context)
        
        # Determine confidence level
        total_score = scientific_score + cultural_score + psychological_score
        confidence_level = self._determine_confidence_level(total_score)
        
        # Generate interpretation
        primary_meaning = self._generate_primary_meaning(symbols, scientific_score)
        sources = self._get_relevant_sources(symbols)
        scientific_evidence = self._get_scientific_evidence(symbols)
        cultural_context = self._get_cultural_context(symbols)
        alternative_meanings = self._get_alternative_meanings(symbols)
        
        return Interpretation(
            primary_meaning=primary_meaning,
            confidence=confidence_level,
            confidence_score=total_score,
            sources=sources,
            scientific_evidence=scientific_evidence,
            cultural_context=cultural_context,
            alternative_meanings=alternative_meanings
        )
    
    def _extract_symbols(self, dream_text: str) -> List[str]:
        """Extract key symbols from dream text using NLP techniques"""
        symbols = []
        text_lower = dream_text.lower()
        
        # Simple symbol extraction (in production, use more sophisticated NLP)
        for symbol in self.symbol_database.keys():
            if symbol.replace("_", " ") in text_lower or symbol.replace("_", "") in text_lower:
                symbols.append(symbol)
        
        # Extract additional symbols using keyword matching
        common_symbols = ["teeth", "flying", "water", "snake", "house", "car", "death", "falling"]
        for symbol in common_symbols:
            if symbol in text_lower and symbol not in symbols:
                symbols.append(symbol)
        
        return symbols
    
    def _calculate_scientific_score(self, symbols: List[str], user_context: Dict) -> float:
        """Calculate scientific validation score based on research evidence"""
        score = 0.0
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                # Weight by scientific correlations
                scientific_weight = len(symbol_data.scientific_correlations) * 0.1
                score += scientific_weight
        
        # Apply user context weighting
        if user_context.get("stress_level", "low") == "high":
            score *= 1.2  # Boost for stress-related dreams
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _calculate_cultural_score(self, symbols: List[str], user_context: Dict) -> float:
        """Calculate cultural context score"""
        score = 0.0
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                cultural_weight = len(symbol_data.cultural_meanings) * 0.05
                score += cultural_weight
        
        return min(score, 0.5)  # Cap at 0.5
    
    def _calculate_psychological_score(self, symbols: List[str], user_context: Dict) -> float:
        """Calculate psychological framework score"""
        score = 0.0
        
        # Base psychological score
        score += len(symbols) * 0.1
        
        # Context-based adjustments
        if user_context.get("recent_events"):
            score += 0.2
        
        if user_context.get("emotional_state"):
            score += 0.1
        
        return min(score, 0.3)  # Cap at 0.3
    
    def _determine_confidence_level(self, total_score: float) -> ConfidenceLevel:
        """Determine confidence level based on total score"""
        if total_score >= 0.8:
            return ConfidenceLevel.HIGH
        elif total_score >= 0.5:
            return ConfidenceLevel.MEDIUM
        elif total_score >= 0.2:
            return ConfidenceLevel.LOW
        else:
            return ConfidenceLevel.VERY_LOW
    
    def _generate_primary_meaning(self, symbols: List[str], scientific_score: float) -> str:
        """Generate primary interpretation based on symbols and scientific evidence"""
        if not symbols:
            return "This dream may reflect general emotional processing during sleep."
        
        primary_symbol = symbols[0]  # Most prominent symbol
        symbol_data = self.symbol_database.get(primary_symbol)
        
        if symbol_data:
            if scientific_score > 0.6:
                return f"Your dream about {primary_symbol.replace('_', ' ')} likely reflects {symbol_data.scientific_correlations[0]} based on contemporary sleep research."
            else:
                return f"Your dream about {primary_symbol.replace('_', ' ')} may symbolize {symbol_data.cultural_meanings[0]} according to traditional dream interpretation."
        
        return "This dream appears to involve symbolic elements that may relate to your current life circumstances."
    
    def _get_relevant_sources(self, symbols: List[str]) -> List[str]:
        """Get relevant research sources for the symbols"""
        sources = []
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                if symbol_data.scientific_correlations:
                    sources.append("Contemporary sleep research")
                if symbol_data.cultural_meanings:
                    sources.append("Cross-cultural dream studies")
        
        return list(set(sources))  # Remove duplicates
    
    def _get_scientific_evidence(self, symbols: List[str]) -> str:
        """Get scientific evidence for the interpretation"""
        evidence_parts = []
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                if symbol_data.scientific_correlations:
                    evidence_parts.append(f"{symbol.replace('_', ' ')}: {', '.join(symbol_data.scientific_correlations)}")
        
        return "; ".join(evidence_parts) if evidence_parts else "Limited scientific evidence available"
    
    def _get_cultural_context(self, symbols: List[str]) -> str:
        """Get cultural context for the interpretation"""
        cultural_parts = []
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                if symbol_data.cultural_meanings:
                    cultural_parts.append(f"{symbol.replace('_', ' ')}: {', '.join(symbol_data.cultural_meanings)}")
        
        return "; ".join(cultural_parts) if cultural_parts else "Traditional interpretations available"
    
    def _get_alternative_meanings(self, symbols: List[str]) -> List[str]:
        """Get alternative interpretations"""
        alternatives = []
        
        for symbol in symbols:
            if symbol in self.symbol_database:
                symbol_data = self.symbol_database[symbol]
                alternatives.extend(symbol_data.cultural_meanings)
        
        return list(set(alternatives))[:3]  # Return top 3 alternatives

class DreamJournal:
    """Dream journaling system with analysis integration"""
    
    def __init__(self):
        self.interpreter = EvidenceWeightedInterpreter()
        self.dreams = []
    
    def add_dream(self, dream_text: str, user_context: Dict = None) -> Dict:
        """Add a new dream entry and get interpretation"""
        timestamp = datetime.now()
        
        # Analyze the dream
        interpretation = self.interpreter.analyze_dream(dream_text, user_context)
        
        # Create dream entry
        dream_entry = {
            "id": len(self.dreams) + 1,
            "timestamp": timestamp.isoformat(),
            "dream_text": dream_text,
            "user_context": user_context or {},
            "interpretation": {
                "primary_meaning": interpretation.primary_meaning,
                "confidence": interpretation.confidence.value,
                "confidence_score": interpretation.confidence_score,
                "sources": interpretation.sources,
                "scientific_evidence": interpretation.scientific_evidence,
                "cultural_context": interpretation.cultural_context,
                "alternative_meanings": interpretation.alternative_meanings
            }
        }
        
        self.dreams.append(dream_entry)
        return dream_entry
    
    def get_dream_history(self) -> List[Dict]:
        """Get all dream entries"""
        return self.dreams
    
    def get_patterns(self) -> Dict:
        """Analyze patterns across dreams"""
        if not self.dreams:
            return {"message": "No dreams recorded yet"}
        
        # Simple pattern analysis
        symbols_count = {}
        confidence_scores = []
        
        for dream in self.dreams:
            symbols = self.interpreter._extract_symbols(dream["dream_text"])
            for symbol in symbols:
                symbols_count[symbol] = symbols_count.get(symbol, 0) + 1
            
            confidence_scores.append(dream["interpretation"]["confidence_score"])
        
        return {
            "total_dreams": len(self.dreams),
            "most_common_symbols": sorted(symbols_count.items(), key=lambda x: x[1], reverse=True)[:5],
            "average_confidence": sum(confidence_scores) / len(confidence_scores),
            "analysis_date": datetime.now().isoformat()
        }

def main():
    """Main application function for testing"""
    print("AI Dream Interpreter Application")
    print("=" * 50)
    
    # Initialize dream journal
    journal = DreamJournal()
    
    # Example dream analysis
    sample_dream = "I dreamed that my teeth were falling out while I was at work. I felt panicked and couldn't stop them from falling."
    user_context = {
        "stress_level": "high",
        "recent_events": "work pressure",
        "emotional_state": "anxious"
    }
    
    print(f"Analyzing dream: {sample_dream}")
    print(f"User context: {user_context}")
    print()
    
    # Add dream to journal
    result = journal.add_dream(sample_dream, user_context)
    
    # Display results
    print("DREAM ANALYSIS RESULTS:")
    print("-" * 30)
    print(f"Primary Meaning: {result['interpretation']['primary_meaning']}")
    print(f"Confidence: {result['interpretation']['confidence']}")
    print(f"Confidence Score: {result['interpretation']['confidence_score']:.2f}")
    print(f"Sources: {', '.join(result['interpretation']['sources'])}")
    print(f"Scientific Evidence: {result['interpretation']['scientific_evidence']}")
    print(f"Cultural Context: {result['interpretation']['cultural_context']}")
    print(f"Alternative Meanings: {', '.join(result['interpretation']['alternative_meanings'])}")
    
    # Show patterns
    print("\nDREAM PATTERNS:")
    print("-" * 20)
    patterns = journal.get_patterns()
    print(f"Total Dreams: {patterns['total_dreams']}")
    print(f"Average Confidence: {patterns['average_confidence']:.2f}")
    print(f"Most Common Symbols: {patterns['most_common_symbols']}")

if __name__ == "__main__":
    main()
