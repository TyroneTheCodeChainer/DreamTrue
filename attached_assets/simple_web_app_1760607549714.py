#!/usr/bin/env python3
"""
Simple Dream Interpreter Web Application
Flask-based web interface for RAG and Agentic dream interpretation

Run this file to start the web server, then open http://localhost:5000 in your browser
"""

from flask import Flask, render_template_string, request, jsonify
from dotenv import load_dotenv
import os
import time

# Load environment variables
load_dotenv()

# Import our systems
from vector_store import VectorStoreManager
from rag_pipeline import RAGPipeline
from agentic_system import DreamInterpreterAgents

# Initialize Flask app
app = Flask(__name__)

# Initialize systems (shared across requests)
print("\n" + "="*80)
print("Initializing Dream Interpreter systems...")
print("="*80)
vector_store = VectorStoreManager()
print(f"✓ Vector database loaded: {vector_store.collection.count()} documents")

rag_system = RAGPipeline(vector_store=vector_store)
print("✓ RAG system ready")

agentic_system = DreamInterpreterAgents(vector_store=vector_store)
print("✓ Agentic system ready")
print("="*80 + "\n")

# HTML Template (embedded to keep it simple)
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamLens - AI Dream Interpreter</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
            padding: 20px;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.95;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            margin-bottom: 20px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #555;
        }

        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.3s;
        }

        textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        input[type="text"],
        input[type="number"] {
            width: 100%;
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus,
        input[type="number"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .context-fields {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }

        .system-choice {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
        }

        .system-option {
            flex: 1;
            padding: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }

        .system-option:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }

        .system-option.selected {
            border-color: #667eea;
            background: #667eea;
            color: white;
        }

        .system-option h3 {
            margin-bottom: 8px;
            font-size: 1.2em;
        }

        .system-option p {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .system-option input[type="radio"] {
            display: none;
        }

        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .loading.active {
            display: block;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .result {
            display: none;
            margin-top: 20px;
        }

        .result.active {
            display: block;
        }

        .result-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
        }

        .result-header h2 {
            margin-bottom: 10px;
        }

        .result-meta {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            opacity: 0.95;
            flex-wrap: wrap;
        }

        .result-body {
            padding: 25px;
            background: white;
            border: 2px solid #667eea;
            border-top: none;
            border-radius: 0 0 10px 10px;
        }

        .interpretation {
            line-height: 1.8;
            font-size: 1.05em;
            margin-bottom: 20px;
            white-space: pre-wrap;
        }

        .alternatives {
            margin-top: 25px;
            padding-top: 25px;
            border-top: 2px solid #e0e0e0;
        }

        .alternatives h3 {
            color: #667eea;
            margin-bottom: 15px;
        }

        .alternative-item {
            background: #f8f9ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            border-left: 4px solid #667eea;
        }

        .error {
            background: #fee;
            border: 2px solid #fcc;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        }

        .error.active {
            display: block;
        }

        .info-box {
            background: #e8f4f8;
            border-left: 4px solid #3498db;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 0.95em;
        }

        @media (max-width: 768px) {
            .context-fields {
                grid-template-columns: 1fr;
            }

            .header h1 {
                font-size: 2em;
            }

            .card {
                padding: 20px;
            }

            .result-meta {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌙 DreamLens</h1>
            <p>AI-Powered Dream Interpretation • Research-Backed Analysis</p>
        </div>

        <div class="card">
            <div class="info-box">
                💡 <strong>Tip:</strong> Provide as much detail as possible about your dream. Include emotions, colors, people, places, and any significant events.
            </div>

            <form id="dreamForm">
                <div class="form-group">
                    <label for="dreamText">Describe Your Dream *</label>
                    <textarea
                        id="dreamText"
                        name="dream_text"
                        rows="8"
                        placeholder="I dreamed that I was flying over my childhood home. The sky was bright blue and I felt incredibly free and happy..."
                        required
                    ></textarea>
                </div>

                <div class="form-group">
                    <label>Optional: Tell us about yourself (improves interpretation)</label>
                    <div class="context-fields">
                        <div>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                placeholder="Age (optional)"
                                min="1"
                                max="120"
                            >
                        </div>
                        <div>
                            <input
                                type="text"
                                id="gender"
                                name="gender"
                                placeholder="Gender (optional)"
                            >
                        </div>
                    </div>
                    <textarea
                        id="recentEvents"
                        name="recent_events"
                        rows="2"
                        placeholder="Recent life events (optional): e.g., 'Recently started a new job' or 'Going through a relationship change'"
                    ></textarea>
                </div>

                <div class="form-group">
                    <label>Choose Analysis System</label>
                    <div class="system-choice">
                        <label class="system-option selected" for="ragSystem">
                            <input type="radio" id="ragSystem" name="system" value="rag" checked>
                            <h3>⚡ Quick Analysis</h3>
                            <p>Fast interpretation (~10 seconds)<br>Good for initial insights</p>
                        </label>
                        <label class="system-option" for="agenticSystem">
                            <input type="radio" id="agenticSystem" name="system" value="agentic">
                            <h3>🧠 Deep Analysis</h3>
                            <p>Comprehensive multi-agent analysis (~40 seconds)<br>Includes alternative interpretations</p>
                        </label>
                    </div>
                </div>

                <button type="submit" id="submitBtn">Interpret My Dream</button>
            </form>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p id="loadingText">Analyzing your dream...</p>
            </div>

            <div class="error" id="error"></div>
        </div>

        <div class="card result" id="result">
            <div class="result-header">
                <h2>Your Dream Interpretation</h2>
                <div class="result-meta">
                    <span id="resultSystem"></span>
                    <span id="resultConfidence"></span>
                    <span id="resultDuration"></span>
                </div>
            </div>
            <div class="result-body">
                <div class="interpretation" id="interpretation"></div>
                <div class="alternatives" id="alternativesSection" style="display: none;">
                    <h3>Alternative Interpretations</h3>
                    <div id="alternatives"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // System selection handling
        document.querySelectorAll('.system-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.system-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                this.querySelector('input[type="radio"]').checked = true;
            });
        });

        // Form submission
        document.getElementById('dreamForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const dreamText = document.getElementById('dreamText').value.trim();
            const age = document.getElementById('age').value;
            const gender = document.getElementById('gender').value.trim();
            const recentEvents = document.getElementById('recentEvents').value.trim();
            const system = document.querySelector('input[name="system"]:checked').value;

            // Validate
            if (!dreamText) {
                showError('Please describe your dream');
                return;
            }

            // Show loading
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('loading').classList.add('active');
            document.getElementById('result').classList.remove('active');
            document.getElementById('error').classList.remove('active');

            // Update loading text based on system
            const loadingText = system === 'agentic'
                ? 'Running 6-agent analysis... This may take 30-40 seconds...'
                : 'Analyzing your dream...';
            document.getElementById('loadingText').textContent = loadingText;

            try {
                // Send request
                const response = await fetch('/interpret', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dream_text: dreamText,
                        age: age || null,
                        gender: gender || null,
                        recent_events: recentEvents || null,
                        system: system
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Display results
                    document.getElementById('resultSystem').textContent = `System: ${data.system}`;
                    document.getElementById('resultConfidence').textContent = `Confidence: ${data.confidence}`;
                    document.getElementById('resultDuration').textContent = `Duration: ${data.duration}s`;
                    document.getElementById('interpretation').textContent = data.interpretation;

                    // Show alternatives if available
                    if (data.alternatives && data.alternatives.length > 0) {
                        const alternativesDiv = document.getElementById('alternatives');
                        alternativesDiv.innerHTML = '';
                        data.alternatives.forEach((alt, index) => {
                            const altDiv = document.createElement('div');
                            altDiv.className = 'alternative-item';
                            altDiv.textContent = `${index + 1}. ${alt}`;
                            alternativesDiv.appendChild(altDiv);
                        });
                        document.getElementById('alternativesSection').style.display = 'block';
                    } else {
                        document.getElementById('alternativesSection').style.display = 'none';
                    }

                    document.getElementById('result').classList.add('active');

                    // Scroll to results
                    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    showError(data.error || 'An error occurred');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Failed to connect to the server. Please make sure the server is running.');
            } finally {
                // Hide loading
                document.getElementById('loading').classList.remove('active');
                document.getElementById('submitBtn').disabled = false;
            }
        });

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.classList.add('active');
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Main page with dream input form"""
    return render_template_string(HTML_TEMPLATE)

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
        print(f"\nError interpreting dream: {e}")
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
    print("DREAMLENS WEB APPLICATION - READY")
    print("="*80)
    print("\n🌐 Open your browser and go to: http://localhost:5000")
    print("\n📝 You can now:")
    print("   - Enter your own dreams")
    print("   - Enter dreams from others")
    print("   - Choose between Quick (RAG) or Deep (Agentic) analysis")
    print("   - See interpretations with confidence scores")
    print("\n⌨️  Press Ctrl+C to stop the server")
    print("="*80 + "\n")

    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
