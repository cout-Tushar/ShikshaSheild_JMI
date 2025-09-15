import pickle
import numpy as np
from utils.data_processor import DataProcessor

class RiskAnalyzer:
    def __init__(self):
        self.data_processor = DataProcessor()
        # Load model from models folder
        with open('models/risk_model.pkl', 'rb') as f:
            self.model = pickle.load(f)

    def analyze_risk(self, subjects, fees_paid):
        processed_data = self.data_processor.process_subjects(subjects)
        if not processed_data:
            return {
                'riskLevel': 'Medium',
                'predictedRiskScore': 0.5,
                'factors': ['Insufficient data']
            }

        avg_attendance = processed_data['avg_attendance']
        avg_marks = processed_data['avg_marks']

        # Predict risk using ML model
        input_data = np.array([[avg_attendance, avg_marks, int(fees_paid)]])
        pred = self.model.predict(input_data)[0]
        risk_map = {0: 'Low', 1: 'Medium', 2: 'High'}

        return {
            'riskLevel': risk_map.get(pred, 'Medium'),
            'predictedRiskScore': float(pred) / 2,
            'factors': self._identify_risk_factors(avg_attendance, avg_marks, fees_paid, subjects)
        }

    def _identify_risk_factors(self, avg_attendance, avg_marks, fees_paid, subjects):
        factors = []

        if avg_attendance < 75:
            factors.append('Low attendance')
        if avg_marks < 60:
            factors.append('Poor academic performance')
        if not fees_paid:
            factors.append('Outstanding fees')

        failing_subjects = [s['name'] for s in subjects if s.get('marks', 0) < 40]
        if failing_subjects:
            factors.append(f'Failing subjects: {", ".join(failing_subjects)}')

        low_attendance_subjects = [s['name'] for s in subjects if s.get('attendance', 0) < 60]
        if low_attendance_subjects:
            factors.append(f'Low attendance in: {", ".join(low_attendance_subjects)}')

        if not factors:
            factors.append('Good overall performance')

        return factors
