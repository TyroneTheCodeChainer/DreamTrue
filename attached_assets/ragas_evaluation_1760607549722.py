#!/usr/bin/env python3
"""
RAGAS Evaluation Framework for Dream Interpretation RAG
Evaluates RAG system performance using RAGAS metrics
"""

import os
import json
from typing import List, Dict
from dataclasses import dataclass, asdict
import time
from pathlib import Path

# Import RAGAS
try:
    from ragas import evaluate
    from ragas.metrics import (
        faithfulness,
        answer_relevancy,
        context_relevancy,
        context_recall,
        context_precision
    )
    from datasets import Dataset
    RAGAS_AVAILABLE = True
except ImportError:
    RAGAS_AVAILABLE = False
    print("Warning: RAGAS not installed. Install with: pip install ragas")

from golden_dataset import GoldenDataset, DreamTestCase
from vector_store import VectorStoreManager
from rag_pipeline import RAGPipeline
from agentic_system import DreamInterpreterAgents

@dataclass
class EvaluationResult:
    """Single evaluation result"""
    test_case_id: str
    dream_text: str
    generated_interpretation: str
    ground_truth: str
    faithfulness_score: float
    answer_relevancy_score: float
    context_relevancy_score: float
    context_recall_score: float
    context_precision_score: float
    response_time: float
    sources_count: int

@dataclass
class SystemComparison:
    """Comparison between different systems"""
    system_name: str
    average_faithfulness: float
    average_relevancy: float
    average_context_precision: float
    average_context_recall: float
    average_response_time: float
    total_tests: int

class RAGEvaluator:
    """Evaluator for RAG system using RAGAS framework"""

    def __init__(self, vector_store: VectorStoreManager, llm_provider: str = "anthropic"):
        """
        Initialize evaluator

        Args:
            vector_store: Vector store manager
            llm_provider: LLM provider
        """
        self.vector_store = vector_store
        self.llm_provider = llm_provider
        self.dataset = GoldenDataset()

        # Initialize systems to test
        self.rag_pipeline = RAGPipeline(vector_store, llm_provider)
        self.agentic_system = DreamInterpreterAgents(vector_store, llm_provider)

        print(f"Evaluator initialized with {llm_provider}")

    def evaluate_single_case(
        self,
        test_case: DreamTestCase,
        system: str = "rag"
    ) -> Dict:
        """
        Evaluate single test case

        Args:
            test_case: Test case to evaluate
            system: "rag" or "agentic"

        Returns:
            Evaluation results
        """
        start_time = time.time()

        # Get interpretation from system
        if system == "rag":
            response = self.rag_pipeline.interpret_dream(
                test_case.dream_text,
                test_case.user_context,
                n_sources=5
            )
            interpretation = response.interpretation
            sources = response.sources_used
            retrieved_contexts = [s['excerpt'] for s in sources]

        elif system == "agentic":
            response = self.agentic_system.interpret_dream(
                test_case.dream_text,
                test_case.user_context
            )
            interpretation = response.interpretation
            sources = response.sources_used
            retrieved_contexts = [s['metadata'].get('source', '') for s in sources[:5]]

        response_time = time.time() - start_time

        # Prepare data for RAGAS evaluation
        result = {
            "test_case_id": test_case.id,
            "dream_text": test_case.dream_text,
            "question": f"What does this dream mean? {test_case.dream_text}",
            "generated_interpretation": interpretation,
            "ground_truth": test_case.ground_truth_interpretation,
            "contexts": retrieved_contexts,
            "response_time": response_time,
            "sources_count": len(sources),
            "system": system
        }

        return result

    def evaluate_system(
        self,
        system: str = "rag",
        test_cases: List[DreamTestCase] = None,
        save_results: bool = True
    ) -> Dict:
        """
        Evaluate system on multiple test cases

        Args:
            system: "rag" or "agentic"
            test_cases: Test cases to evaluate (None = all)
            save_results: Save results to file

        Returns:
            Evaluation metrics
        """
        if test_cases is None:
            test_cases = self.dataset.test_cases

        print(f"\n{'='*80}")
        print(f"Evaluating {system.upper()} System")
        print(f"{'='*80}\n")
        print(f"Running {len(test_cases)} test cases...")

        results = []
        for idx, test_case in enumerate(test_cases, 1):
            print(f"\nTest {idx}/{len(test_cases)}: {test_case.id} ({test_case.category})")
            try:
                result = self.evaluate_single_case(test_case, system)
                results.append(result)
                print(f"  ✓ Completed in {result['response_time']:.2f}s")
            except Exception as e:
                print(f"  ✗ Error: {e}")
                continue

        # Calculate RAGAS metrics if available
        if RAGAS_AVAILABLE and results:
            print(f"\nCalculating RAGAS metrics...")
            metrics = self._calculate_ragas_metrics(results)
        else:
            print("\nRAGAS not available, using simplified metrics...")
            metrics = self._calculate_simple_metrics(results)

        # Save results
        if save_results:
            self._save_results(results, metrics, system)

        return metrics

    def _calculate_ragas_metrics(self, results: List[Dict]) -> Dict:
        """Calculate RAGAS metrics"""
        # Prepare dataset for RAGAS
        data = {
            "question": [r["question"] for r in results],
            "answer": [r["generated_interpretation"] for r in results],
            "contexts": [r["contexts"] for r in results],
            "ground_truth": [r["ground_truth"] for r in results]
        }

        dataset = Dataset.from_dict(data)

        # Set OpenAI API key for RAGAS (it requires it for evaluation)
        if not os.getenv("OPENAI_API_KEY"):
            print("Warning: RAGAS requires OPENAI_API_KEY for evaluation metrics")
            return self._calculate_simple_metrics(results)

        # Evaluate
        try:
            evaluation_result = evaluate(
                dataset,
                metrics=[
                    faithfulness,
                    answer_relevancy,
                    context_relevancy,
                    context_precision,
                    context_recall
                ]
            )

            metrics = {
                "faithfulness": float(evaluation_result["faithfulness"]),
                "answer_relevancy": float(evaluation_result["answer_relevancy"]),
                "context_relevancy": float(evaluation_result["context_relevancy"]),
                "context_precision": float(evaluation_result["context_precision"]),
                "context_recall": float(evaluation_result["context_recall"]),
                "average_response_time": sum(r["response_time"] for r in results) / len(results),
                "total_tests": len(results)
            }

            return metrics

        except Exception as e:
            print(f"RAGAS evaluation error: {e}")
            return self._calculate_simple_metrics(results)

    def _calculate_simple_metrics(self, results: List[Dict]) -> Dict:
        """Calculate simplified metrics without RAGAS"""
        # Simple metrics based on response quality indicators
        avg_response_time = sum(r["response_time"] for r in results) / len(results)
        avg_sources = sum(r["sources_count"] for r in results) / len(results)

        # Simple relevancy check (keyword overlap)
        relevancy_scores = []
        for result in results:
            gen = set(result["generated_interpretation"].lower().split())
            truth = set(result["ground_truth"].lower().split())
            overlap = len(gen & truth) / len(truth) if truth else 0
            relevancy_scores.append(min(overlap, 1.0))

        return {
            "average_response_time": avg_response_time,
            "average_sources_retrieved": avg_sources,
            "keyword_overlap_score": sum(relevancy_scores) / len(relevancy_scores),
            "total_tests": len(results),
            "note": "Simplified metrics (RAGAS not available or configured)"
        }

    def _save_results(self, results: List[Dict], metrics: Dict, system: str):
        """Save evaluation results"""
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_dir = Path(__file__).parent / "evaluation_results"
        output_dir.mkdir(exist_ok=True)

        # Save detailed results
        results_file = output_dir / f"{system}_results_{timestamp}.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        # Save metrics summary
        metrics_file = output_dir / f"{system}_metrics_{timestamp}.json"
        with open(metrics_file, 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=2)

        print(f"\nResults saved to {output_dir}/")
        print(f"  - {results_file.name}")
        print(f"  - {metrics_file.name}")

    def compare_systems(self, test_cases: List[DreamTestCase] = None) -> Dict:
        """
        Compare RAG and Agentic systems

        Args:
            test_cases: Test cases to use

        Returns:
            Comparison results
        """
        if test_cases is None:
            # Use subset for comparison
            test_cases = self.dataset.test_cases[:5]

        print(f"\n{'='*80}")
        print("SYSTEM COMPARISON")
        print(f"{'='*80}\n")

        # Evaluate both systems
        print("Evaluating RAG Pipeline...")
        rag_metrics = self.evaluate_system("rag", test_cases, save_results=True)

        print("\n\nEvaluating Agentic System...")
        agentic_metrics = self.evaluate_system("agentic", test_cases, save_results=True)

        # Create comparison
        comparison = {
            "rag_pipeline": rag_metrics,
            "agentic_system": agentic_metrics,
            "test_cases_count": len(test_cases)
        }

        # Print comparison table
        self._print_comparison_table(comparison)

        # Save comparison
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_dir = Path(__file__).parent / "evaluation_results"
        comparison_file = output_dir / f"system_comparison_{timestamp}.json"
        with open(comparison_file, 'w') as f:
            json.dump(comparison, f, indent=2)

        print(f"\nComparison saved to {comparison_file}")

        return comparison

    def _print_comparison_table(self, comparison: Dict):
        """Print comparison table"""
        print(f"\n{'='*80}")
        print("PERFORMANCE COMPARISON")
        print(f"{'='*80}\n")

        rag = comparison["rag_pipeline"]
        agentic = comparison["agentic_system"]

        print(f"{'Metric':<30} {'RAG Pipeline':<20} {'Agentic System':<20}")
        print(f"{'-'*70}")

        # Response time
        print(f"{'Avg Response Time (s)':<30} {rag.get('average_response_time', 0):<20.2f} {agentic.get('average_response_time', 0):<20.2f}")

        # RAGAS metrics if available
        if 'faithfulness' in rag:
            print(f"{'Faithfulness':<30} {rag['faithfulness']:<20.3f} {agentic['faithfulness']:<20.3f}")
            print(f"{'Answer Relevancy':<30} {rag['answer_relevancy']:<20.3f} {agentic['answer_relevancy']:<20.3f}")
            print(f"{'Context Precision':<30} {rag['context_precision']:<20.3f} {agentic['context_precision']:<20.3f}")
            print(f"{'Context Recall':<30} {rag['context_recall']:<20.3f} {agentic['context_recall']:<20.3f}")

        print(f"\n{'='*80}")

def run_evaluation():
    """Run complete evaluation"""
    print("=" * 80)
    print("DREAM INTERPRETATION RAG - RAGAS EVALUATION")
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

    # Initialize evaluator
    print(f"\n2. Initializing evaluator...")
    evaluator = RAGEvaluator(vector_store, llm_provider)

    # Load dataset
    print(f"\n3. Loading golden dataset...")
    print(f"   Total test cases: {len(evaluator.dataset.test_cases)}")

    # Run comparison (use subset to save costs)
    print(f"\n4. Running system comparison...")
    print("   (Using first 5 test cases for demo)")

    comparison = evaluator.compare_systems(
        test_cases=evaluator.dataset.test_cases[:5]
    )

    print(f"\n{'='*80}")
    print("EVALUATION COMPLETE!")
    print(f"{'='*80}")

def main():
    """Main function"""
    run_evaluation()

if __name__ == "__main__":
    main()
