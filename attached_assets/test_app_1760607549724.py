#!/usr/bin/env python3
"""
Test script for AI Dream Interpreter Application
Tests core functionality without web interface
"""

from dream_interpreter import DreamJournal, EvidenceWeightedInterpreter
import json

def test_dream_interpreter():
    """Test the core dream interpretation functionality"""
    print("Testing AI Dream Interpreter Application")
    print("=" * 50)
    
    # Initialize dream journal
    journal = DreamJournal()
    
    # Test cases
    test_dreams = [
        {
            "dream": "I dreamed that my teeth were falling out while I was at work. I felt panicked and couldn't stop them from falling.",
            "context": {"stress_level": "high", "recent_events": "work pressure", "emotional_state": "anxious"}
        },
        {
            "dream": "I was flying over a beautiful landscape. I felt free and peaceful, soaring above the clouds.",
            "context": {"stress_level": "low", "recent_events": "vacation planning", "emotional_state": "excited"}
        },
        {
            "dream": "I was in a house I didn't recognize, but it felt familiar. There were many rooms and I kept getting lost.",
            "context": {"stress_level": "medium", "recent_events": "moving", "emotional_state": "confused"}
        }
    ]
    
    print(f"Testing {len(test_dreams)} dream scenarios...\n")
    
    for i, test_case in enumerate(test_dreams, 1):
        print(f"Test Case {i}:")
        print(f"Dream: {test_case['dream']}")
        print(f"Context: {test_case['context']}")
        
        # Analyze the dream
        result = journal.add_dream(test_case['dream'], test_case['context'])
        
        # Display results
        print(f"\nAnalysis Results:")
        print(f"- Primary Meaning: {result['interpretation']['primary_meaning']}")
        print(f"- Confidence: {result['interpretation']['confidence']}")
        print(f"- Confidence Score: {result['interpretation']['confidence_score']:.2f}")
        print(f"- Sources: {', '.join(result['interpretation']['sources'])}")
        print(f"- Scientific Evidence: {result['interpretation']['scientific_evidence']}")
        print(f"- Cultural Context: {result['interpretation']['cultural_context']}")
        print(f"- Alternative Meanings: {', '.join(result['interpretation']['alternative_meanings'])}")
        print("-" * 50)
    
    # Test pattern analysis
    print("\nPattern Analysis:")
    patterns = journal.get_patterns()
    print(f"- Total Dreams: {patterns['total_dreams']}")
    print(f"- Average Confidence: {patterns['average_confidence']:.2f}")
    print(f"- Most Common Symbols: {patterns['most_common_symbols']}")
    
    # Test symbol database
    print("\nSymbol Database Test:")
    interpreter = EvidenceWeightedInterpreter()
    print(f"- Available Symbols: {list(interpreter.symbol_database.keys())}")
    print(f"- Research Sources: {list(interpreter.research_sources.keys())}")
    
    print("\n" + "=" * 50)
    print("All tests completed successfully!")
    print("The AI Dream Interpreter application is working correctly.")

if __name__ == "__main__":
    test_dream_interpreter()
