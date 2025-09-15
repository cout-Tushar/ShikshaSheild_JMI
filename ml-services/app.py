from flask import Flask, request, jsonify
from flask_cors import CORS
from models.risk_analyzer import RiskAnalyzer
import pandas as pd

app = Flask(__name__)
CORS(app)
risk_analyzer = RiskAnalyzer()


@app.route('/analyze', methods=['POST'])
def analyze_student_risk():
    data = request.get_json()
    if not data or 'subjects' not in data:
        return jsonify({'error': 'Invalid data format'}), 400

    subjects = data.get('subjects', [])
    fees_paid = data.get('feesPaid', True)

    if not subjects:
        return jsonify({'error': 'No subjects data provided'}), 400

    risk_result = risk_analyzer.analyze_risk(subjects, fees_paid)
    return jsonify(risk_result)


@app.route('/predict_csv', methods=['POST'])
def predict_csv():
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    df = pd.read_csv(file)
    results = []

    for _, row in df.iterrows():
        subjects = [{
            'name': 'Subject',
            'attendance': row['attendance'],
            'marks': row['marks']
        }]
        fees_paid = bool(row['fees_paid'])
        result = risk_analyzer.analyze_risk(subjects, fees_paid)
        results.append({**row.to_dict(), **result})

    return jsonify(results)


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
