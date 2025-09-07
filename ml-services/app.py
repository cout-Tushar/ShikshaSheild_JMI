from flask import Flask, request, jsonify
from flask_cors import CORS
from models.risk_analyzer import RiskAnalyzer
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

risk_analyzer = RiskAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze_student_risk():
    try:
        data = request.get_json()
        
        if not data or 'subjects' not in data:
            return jsonify({'error': 'Invalid data format'}), 400
        
        subjects = data.get('subjects', [])
        fees_paid = data.get('feesPaid', True)
        
        if not subjects:
            return jsonify({'error': 'No subjects data provided'}), 400
        
        # Analyze risk
        risk_result = risk_analyzer.analyze_risk(subjects, fees_paid)
        
        logger.info(f"Risk analysis completed: {risk_result}")
        
        return jsonify(risk_result)
    
    except Exception as e:
        logger.error(f"Error analyzing risk: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)