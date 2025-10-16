#!/usr/bin/env python3
"""
AI Dream Interpreter Web Application
Flask-based web interface for dream analysis

Features:
- User-friendly dream journaling interface
- Real-time AI interpretation
- Progress tracking and pattern recognition
- Source transparency and confidence scoring
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import os
from dream_interpreter import DreamJournal, EvidenceWeightedInterpreter

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dream_journal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class DreamEntry(db.Model):
    """Database model for dream entries"""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    dream_text = db.Column(db.Text, nullable=False)
    user_context = db.Column(db.Text)  # JSON string
    interpretation = db.Column(db.Text)  # JSON string
    confidence_score = db.Column(db.Float)
    symbols = db.Column(db.Text)  # JSON string
    
    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'dream_text': self.dream_text,
            'user_context': json.loads(self.user_context) if self.user_context else {},
            'interpretation': json.loads(self.interpretation) if self.interpretation else {},
            'confidence_score': self.confidence_score,
            'symbols': json.loads(self.symbols) if self.symbols else []
        }

# Initialize dream journal
dream_journal = DreamJournal()

@app.route('/')
def index():
    """Main page with dream entry form"""
    recent_dreams = DreamEntry.query.order_by(DreamEntry.timestamp.desc()).limit(5).all()
    return render_template('index.html', recent_dreams=recent_dreams)

@app.route('/analyze', methods=['POST'])
def analyze_dream():
    """Analyze a dream and return results"""
    try:
        data = request.get_json()
        dream_text = data.get('dream_text', '').strip()
        user_context = data.get('user_context', {})
        
        if not dream_text:
            return jsonify({'error': 'Dream text is required'}), 400
        
        # Analyze the dream
        result = dream_journal.add_dream(dream_text, user_context)
        
        # Save to database
        dream_entry = DreamEntry(
            dream_text=dream_text,
            user_context=json.dumps(user_context),
            interpretation=json.dumps(result['interpretation']),
            confidence_score=result['interpretation']['confidence_score'],
            symbols=json.dumps(dream_journal.interpreter._extract_symbols(dream_text))
        )
        
        db.session.add(dream_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'dream_id': dream_entry.id,
            'interpretation': result['interpretation'],
            'timestamp': dream_entry.timestamp.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dreams')
def dreams():
    """Display all dream entries"""
    dreams = DreamEntry.query.order_by(DreamEntry.timestamp.desc()).all()
    return render_template('dreams.html', dreams=dreams)

@app.route('/dream/<int:dream_id>')
def dream_detail(dream_id):
    """Display detailed view of a specific dream"""
    dream = DreamEntry.query.get_or_404(dream_id)
    return render_template('dream_detail.html', dream=dream)

@app.route('/patterns')
def patterns():
    """Display dream patterns and analytics"""
    dreams = DreamEntry.query.all()
    
    # Calculate patterns
    symbols_count = {}
    confidence_scores = []
    monthly_stats = {}
    
    for dream in dreams:
        # Symbol frequency
        symbols = json.loads(dream.symbols) if dream.symbols else []
        for symbol in symbols:
            symbols_count[symbol] = symbols_count.get(symbol, 0) + 1
        
        # Confidence scores
        if dream.confidence_score:
            confidence_scores.append(dream.confidence_score)
        
        # Monthly stats
        month_key = dream.timestamp.strftime('%Y-%m')
        monthly_stats[month_key] = monthly_stats.get(month_key, 0) + 1
    
    patterns_data = {
        'total_dreams': len(dreams),
        'most_common_symbols': sorted(symbols_count.items(), key=lambda x: x[1], reverse=True)[:10],
        'average_confidence': sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0,
        'monthly_stats': monthly_stats,
        'confidence_distribution': {
            'high': len([s for s in confidence_scores if s >= 0.8]),
            'medium': len([s for s in confidence_scores if 0.5 <= s < 0.8]),
            'low': len([s for s in confidence_scores if s < 0.5])
        }
    }
    
    return render_template('patterns.html', patterns=patterns_data)

@app.route('/research')
def research():
    """Display research sources and methodology"""
    interpreter = EvidenceWeightedInterpreter()
    research_sources = interpreter.research_sources
    
    return render_template('research.html', research_sources=research_sources)

@app.route('/api/dreams')
def api_dreams():
    """API endpoint for dream data"""
    dreams = DreamEntry.query.order_by(DreamEntry.timestamp.desc()).all()
    return jsonify([dream.to_dict() for dream in dreams])

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """API endpoint for dream analysis"""
    return analyze_dream()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("Starting AI Dream Interpreter Web Application...")
    print("Access the application at: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
