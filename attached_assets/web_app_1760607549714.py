#!/usr/bin/env python3
"""
Dream Interpreter Web Application
Simple Flask-based web interface for dream interpretation
"""

from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import time
from pathlib import Path

# Load environment variables
load_dotenv()

# Import our systems
from vector_store import VectorStoreManager
from rag_pipeline import RAGPipeline
from agentic_system import DreamInterpreterAgents

# Initialize Flask app
app = Flask(__name__)

# Initialize systems (shared across requests)
print("Initializing Dream Interpreter systems...")
vector_store = VectorStoreManager()
rag_system = RAGPipeline(vector_store=vector_store)
agentic_system = DreamInterpreterAgents(vector_store=vector_store)
print(f"Systems ready! Vector database has {vector_store.collection.count()} documents")

@app.route('/')
def index():
    """Main page with dream input form"""
    return render_template('index.html')

@app.route('/interpret', methods=['POST'])
def interpret_dream():
    """
    API endpoint to interpret dreams
    Accepts JSON with dream text, context, and system choice
    """
    try:
        # Get request data
        data = request.json
        dream_text = data.get('dream_text', '').strip()
        system_choice = data.get('system', 'rag')  # 'rag' or 'agentic'

        # Optional user context
        age = data.get('age')
        gender = data.get('gender', '').strip()
        recent_events = data.get('recent_events', '').strip()

        # Validate input
        if not dream_text:
            return jsonify({
                'success': False,
                'error': 'Please provide a dream description'
            }), 400

        # Build user context
        user_context = {}
        if age:
            try:
                user_context['age'] = int(age)
            except ValueError:
                pass
        if gender:
            user_context['gender'] = gender
        if recent_events:
            user_context['recent_life_events'] = recent_events

        # Record start time
        start_time = time.time()

        # Run interpretation based on system choice
        if system_choice == 'agentic':
            result = agentic_system.interpret_dream(
                dream_text=dream_text,
                user_context=user_context if user_context else None
            )

            # Format response
            response = {
                'success': True,
                'system': 'Agentic (6-Agent Analysis)',
                'interpretation': result.interpretation,
                'confidence': f"{result.confidence_score:.0%}",
                'confidence_raw': result.confidence_score,
                'sources_count': len(result.sources_used),
                'alternatives_count': len(result.alternative_interpretations),
                'alternatives': result.alternative_interpretations,
                'duration': round(time.time() - start_time, 2),
                'agent_steps': len(result.agent_trace) if hasattr(result, 'agent_trace') else 0
            }
        else:
            # RAG system
            result = rag_system.interpret_dream(
                dream_text=dream_text,
                user_context=user_context if user_context else None
            )

            # Format response
            response = {
                'success': True,
                'system': 'RAG (Quick Analysis)',
                'interpretation': result.interpretation,
                'confidence': f"{result.confidence_score:.0%}",
                'confidence_raw': result.confidence_score,
                'sources_count': len(result.sources_used),
                'duration': round(time.time() - start_time, 2)
            }

        return jsonify(response)

    except Exception as e:
        print(f"Error interpreting dream: {e}")
        import traceback
        traceback.print_exc()

        return jsonify({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'vector_db_documents': vector_store.collection.count(),
        'systems': ['rag', 'agentic']
    })

if __name__ == '__main__':
    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        print("\nERROR: No API key found!")
        print("Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file")
        exit(1)

    # Check vector database
    if vector_store.collection.count() == 0:
        print("\nERROR: Vector database is empty!")
        print("Please run 'python build_database.py' first")
        exit(1)

    print("\n" + "="*80)
    print("DREAM INTERPRETER WEB APPLICATION")
    print("="*80)
    print("\nStarting server...")
    print("Open your browser and go to: http://localhost:5000")
    print("\nPress Ctrl+C to stop the server")
    print("="*80 + "\n")

    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)
