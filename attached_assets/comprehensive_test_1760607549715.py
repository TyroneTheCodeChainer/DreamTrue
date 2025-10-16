#!/usr/bin/env python3
"""
Comprehensive System Test for Dream Interpreter
Tests both RAG and Agentic systems with all 3 sample dreams
Generates detailed test report
"""

import os
import sys
import time
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our systems
from vector_store import VectorStoreManager
from rag_pipeline import RAGPipeline
from agentic_system import DreamInterpreterAgents

# Test dreams (same as quick_test.py)
TEST_DREAMS = [
    {
        "id": "test_1",
        "name": "Flying Dream",
        "dream": "I was flying over my childhood home. The sky was bright blue and I felt incredibly free and happy. I could control my direction by thinking about where I wanted to go.",
        "context": {"age": 28, "gender": "female", "recent_life_events": "Recently got promoted at work"}
    },
    {
        "id": "test_2",
        "name": "Chase Dream",
        "dream": "I was being chased through a dark forest by something I couldn't see. I kept running but my legs felt heavy. I tried to scream but no sound came out.",
        "context": {"age": 35, "gender": "male", "recent_life_events": "Facing deadline pressures at work"}
    },
    {
        "id": "test_3",
        "name": "Teeth Falling Dream",
        "dream": "I was looking in the mirror and noticed one of my teeth was loose. When I touched it, it fell out. Then more teeth started falling out one by one.",
        "context": {"age": 42, "gender": "female", "recent_life_events": "Going through divorce"}
    }
]

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(title.center(80))
    print("=" * 80)

def print_subheader(title):
    """Print a formatted subheader"""
    print("\n" + "-" * 80)
    print(title)
    print("-" * 80)

def test_rag_system(vector_store, dream_data):
    """
    Test RAG system with a single dream

    Args:
        vector_store: VectorStoreManager instance
        dream_data: Dictionary with dream information

    Returns:
        Dictionary with test results
    """
    print_subheader(f"Testing RAG System: {dream_data['name']}")

    # Initialize RAG pipeline
    rag = RAGPipeline(vector_store=vector_store)

    # Record start time
    start_time = time.time()

    try:
        # Run interpretation
        result = rag.interpret_dream(
            dream_text=dream_data['dream'],
            user_context=dream_data['context']
        )

        # Calculate duration
        duration = time.time() - start_time

        # Print results
        print(f"\nInterpretation:\n{result.interpretation}\n")
        print(f"Confidence: {result.confidence_score:.1%}")
        print(f"Sources Used: {len(result.sources_used)}")
        print(f"Duration: {duration:.2f} seconds")

        return {
            "success": True,
            "dream_name": dream_data['name'],
            "interpretation": result.interpretation,
            "confidence": result.confidence_score,
            "sources_count": len(result.sources_used),
            "duration": duration,
            "error": None
        }

    except Exception as e:
        duration = time.time() - start_time
        print(f"\n[ERROR] {str(e)}")

        return {
            "success": False,
            "dream_name": dream_data['name'],
            "interpretation": None,
            "confidence": 0,
            "sources_count": 0,
            "duration": duration,
            "error": str(e)
        }

def test_agentic_system(vector_store, dream_data):
    """
    Test Agentic system with a single dream

    Args:
        vector_store: VectorStoreManager instance
        dream_data: Dictionary with dream information

    Returns:
        Dictionary with test results
    """
    print_subheader(f"Testing Agentic System: {dream_data['name']}")

    # Initialize agentic system
    agents = DreamInterpreterAgents(vector_store=vector_store)

    # Record start time
    start_time = time.time()

    try:
        # Run interpretation
        result = agents.interpret_dream(
            dream_text=dream_data['dream'],
            user_context=dream_data['context']
        )

        # Calculate duration
        duration = time.time() - start_time

        # Print results (truncated)
        print(f"\nFinal Interpretation:\n{result.interpretation[:500]}...\n")
        print(f"Confidence: {result.confidence_score:.1%}")
        print(f"Sources Used: {len(result.sources_used)}")
        print(f"Alternative Interpretations: {len(result.alternative_interpretations)}")
        print(f"Agent Workflow Steps: {len(result.agent_trace)}")
        print(f"Duration: {duration:.2f} seconds")

        return {
            "success": True,
            "dream_name": dream_data['name'],
            "interpretation": result.interpretation,
            "confidence": result.confidence_score,
            "sources_count": len(result.sources_used),
            "alternatives_count": len(result.alternative_interpretations),
            "agent_steps": len(result.agent_trace),
            "duration": duration,
            "error": None
        }

    except Exception as e:
        duration = time.time() - start_time
        print(f"\n[ERROR] {str(e)}")

        return {
            "success": False,
            "dream_name": dream_data['name'],
            "interpretation": None,
            "confidence": 0,
            "sources_count": 0,
            "alternatives_count": 0,
            "agent_steps": 0,
            "duration": duration,
            "error": str(e)
        }

def generate_report(rag_results, agentic_results):
    """Generate comprehensive test report"""

    print_header("COMPREHENSIVE TEST REPORT")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\nTest Date: {timestamp}")
    print(f"Total Dreams Tested: {len(TEST_DREAMS)}")

    # RAG System Summary
    print_subheader("RAG System Summary")
    rag_successes = sum(1 for r in rag_results if r['success'])
    rag_avg_confidence = sum(r['confidence'] for r in rag_results if r['success']) / max(rag_successes, 1)
    rag_avg_duration = sum(r['duration'] for r in rag_results if r['success']) / max(rag_successes, 1)

    print(f"Success Rate: {rag_successes}/{len(rag_results)} ({rag_successes/len(rag_results)*100:.1f}%)")
    print(f"Average Confidence: {rag_avg_confidence:.1%}")
    print(f"Average Duration: {rag_avg_duration:.2f} seconds")
    print(f"Average Sources: {sum(r['sources_count'] for r in rag_results if r['success']) / max(rag_successes, 1):.1f}")

    # Agentic System Summary
    print_subheader("Agentic System Summary")
    agentic_successes = sum(1 for r in agentic_results if r['success'])
    agentic_avg_confidence = sum(r['confidence'] for r in agentic_results if r['success']) / max(agentic_successes, 1)
    agentic_avg_duration = sum(r['duration'] for r in agentic_results if r['success']) / max(agentic_successes, 1)

    print(f"Success Rate: {agentic_successes}/{len(agentic_results)} ({agentic_successes/len(agentic_results)*100:.1f}%)")
    print(f"Average Confidence: {agentic_avg_confidence:.1%}")
    print(f"Average Duration: {agentic_avg_duration:.2f} seconds")
    print(f"Average Sources: {sum(r['sources_count'] for r in agentic_results if r['success']) / max(agentic_successes, 1):.1f}")
    print(f"Average Alternatives: {sum(r['alternatives_count'] for r in agentic_results if r['success']) / max(agentic_successes, 1):.1f}")

    # Comparison
    print_subheader("System Comparison")
    if rag_successes > 0 and agentic_successes > 0:
        confidence_improvement = ((agentic_avg_confidence - rag_avg_confidence) / rag_avg_confidence) * 100
        speed_difference = rag_avg_duration / agentic_avg_duration

        print(f"Confidence Improvement (Agentic vs RAG): {confidence_improvement:+.1f}%")
        print(f"Speed Difference (RAG vs Agentic): {speed_difference:.1f}x faster")
        print(f"\nAgentic Benefits:")
        print(f"  - Higher confidence: {agentic_avg_confidence:.1%} vs {rag_avg_confidence:.1%}")
        print(f"  - Alternative interpretations provided")
        print(f"  - Multi-perspective analysis (6 agents)")
        print(f"\nRAG Benefits:")
        print(f"  - Faster response: {rag_avg_duration:.1f}s vs {agentic_avg_duration:.1f}s")
        print(f"  - Lower API cost (~4x cheaper)")
        print(f"  - Simpler output for casual users")

    # Individual Results
    print_subheader("Individual Test Results")
    for i, dream in enumerate(TEST_DREAMS):
        print(f"\n{i+1}. {dream['name']}")
        print(f"   RAG: {'PASS' if rag_results[i]['success'] else 'FAIL'} "
              f"- Confidence: {rag_results[i]['confidence']:.1%}, "
              f"Duration: {rag_results[i]['duration']:.2f}s")
        print(f"   Agentic: {'PASS' if agentic_results[i]['success'] else 'FAIL'} "
              f"- Confidence: {agentic_results[i]['confidence']:.1%}, "
              f"Duration: {agentic_results[i]['duration']:.2f}s")

        if not rag_results[i]['success']:
            print(f"   RAG Error: {rag_results[i]['error']}")
        if not agentic_results[i]['success']:
            print(f"   Agentic Error: {agentic_results[i]['error']}")

    # Overall Status
    print_header("OVERALL TEST STATUS")
    total_tests = len(rag_results) + len(agentic_results)
    total_passes = rag_successes + agentic_successes
    overall_pass_rate = (total_passes / total_tests) * 100

    print(f"\nTotal Tests: {total_tests}")
    print(f"Total Passes: {total_passes}")
    print(f"Pass Rate: {overall_pass_rate:.1f}%")

    if overall_pass_rate == 100:
        print("\n[SUCCESS] ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION")
    elif overall_pass_rate >= 80:
        print("\n[WARNING] MOST TESTS PASSED - REVIEW FAILURES")
    else:
        print("\n[FAILURE] MULTIPLE FAILURES - SYSTEM NEEDS ATTENTION")

    # Save report to file
    report_data = {
        "timestamp": timestamp,
        "rag_results": rag_results,
        "agentic_results": agentic_results,
        "summary": {
            "total_tests": total_tests,
            "total_passes": total_passes,
            "pass_rate": overall_pass_rate,
            "rag_avg_confidence": rag_avg_confidence,
            "agentic_avg_confidence": agentic_avg_confidence,
            "rag_avg_duration": rag_avg_duration,
            "agentic_avg_duration": agentic_avg_duration
        }
    }

    report_file = Path(__file__).parent.parent / "COMPREHENSIVE_TEST_REPORT.json"
    with open(report_file, 'w') as f:
        json.dump(report_data, f, indent=2)

    print(f"\nDetailed report saved to: {report_file}")

def main():
    """Main test execution"""
    print_header("DREAM INTERPRETER - COMPREHENSIVE SYSTEM TEST")

    print(f"\nTest Configuration:")
    print(f"  - Dreams to test: {len(TEST_DREAMS)}")
    print(f"  - Systems to test: RAG + Agentic")
    print(f"  - Total tests: {len(TEST_DREAMS) * 2}")

    # Check API key
    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        print("\n[ERROR] No API key found. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env file")
        sys.exit(1)

    # Initialize vector store (shared by both systems)
    print_subheader("Initializing Vector Store")
    vector_store = VectorStoreManager()

    if vector_store.collection.count() == 0:
        print("\n[ERROR] Vector database is empty. Please run build_database.py first.")
        sys.exit(1)

    print(f"Vector database ready: {vector_store.collection.count()} documents")

    # Test RAG system with all dreams
    print_header("TESTING RAG SYSTEM")
    rag_results = []
    for dream in TEST_DREAMS:
        result = test_rag_system(vector_store, dream)
        rag_results.append(result)
        time.sleep(1)  # Small delay between tests

    # Test Agentic system with all dreams
    print_header("TESTING AGENTIC SYSTEM")
    agentic_results = []
    for dream in TEST_DREAMS:
        result = test_agentic_system(vector_store, dream)
        agentic_results.append(result)
        time.sleep(1)  # Small delay between tests

    # Generate comprehensive report
    generate_report(rag_results, agentic_results)

    print_header("TEST COMPLETE")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[FATAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
