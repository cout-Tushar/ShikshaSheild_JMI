import numpy as np
from utils.data_processor import DataProcessor

class RiskAnalyzer:
    def __init__(self):
        self.data_processor = DataProcessor()
    
    def analyze_risk(self, subjects, fees_paid):
        """
        Analyze student risk based on subjects data and fee status
        
        Args:
            subjects (list): List of subject data with attendance and marks
            fees_paid (bool): Whether student has paid fees
            
        Returns:
            dict: Risk analysis results
        """
        try:
            # Process subject data
            processed_data = self.data_processor.process_subjects(subjects)
            
            if not processed_data:
                return {
                    'riskLevel': 'Medium',
                    'predictedRiskScore': 0.5,
                    'factors': ['Insufficient data']
                }
            
            avg_attendance = processed_data['avg_attendance']
            avg_marks = processed_data['avg_marks']
            subject_count = processed_data['subject_count']
            
            # Calculate base risk score
            risk_score = self._calculate_risk_score(avg_attendance, avg_marks, fees_paid)
            
            # Determine risk level
            risk_level = self._determine_risk_level(risk_score)
            
            # Identify risk factors
            risk_factors = self._identify_risk_factors(avg_attendance, avg_marks, fees_paid, subjects)
            
            return {
                'riskLevel': risk_level,
                'predictedRiskScore': round(risk_score, 3),
                'factors': risk_factors,
                'avgAttendance': round(avg_attendance, 1),
                'avgMarks': round(avg_marks, 1),
                'subjectCount': subject_count
            }
            
        except Exception as e:
            print(f"Error in risk analysis: {str(e)}")
            return {
                'riskLevel': 'Medium',
                'predictedRiskScore': 0.5,
                'factors': ['Analysis error']
            }
    
    def _calculate_risk_score(self, avg_attendance, avg_marks, fees_paid):
        """Calculate risk score based on multiple factors"""
        
        # Attendance risk (0-1, higher is more risky)
        if avg_attendance >= 85:
            attendance_risk = 0.0
        elif avg_attendance >= 75:
            attendance_risk = 0.2
        elif avg_attendance >= 65:
            attendance_risk = 0.4
        elif avg_attendance >= 50:
            attendance_risk = 0.6
        else:
            attendance_risk = 0.8
        
        # Marks risk (0-1, higher is more risky)
        if avg_marks >= 80:
            marks_risk = 0.0
        elif avg_marks >= 70:
            marks_risk = 0.2
        elif avg_marks >= 60:
            marks_risk = 0.4
        elif avg_marks >= 50:
            marks_risk = 0.6
        else:
            marks_risk = 0.8
        
        # Fee risk
        fee_risk = 0.0 if fees_paid else 0.3
        
        # Weighted combination
        risk_score = (attendance_risk * 0.4) + (marks_risk * 0.4) + (fee_risk * 0.2)
        
        return min(1.0, max(0.0, risk_score))
    
    def _determine_risk_level(self, risk_score):
        """Determine risk level based on score"""
        if risk_score <= 0.3:
            return 'Low'
        elif risk_score <= 0.6:
            return 'Medium'
        else:
            return 'High'
    
    def _identify_risk_factors(self, avg_attendance, avg_marks, fees_paid, subjects):
        """Identify specific risk factors"""
        factors = []
        
        if avg_attendance < 75:
            factors.append('Low attendance')
        
        if avg_marks < 60:
            factors.append('Poor academic performance')
        
        if not fees_paid:
            factors.append('Outstanding fees')
        
        # Check for failing subjects
        failing_subjects = [s['name'] for s in subjects if s.get('marks', 0) < 40]
        if failing_subjects:
            factors.append(f'Failing subjects: {", ".join(failing_subjects)}')
        
        # Check for subjects with very low attendance
        low_attendance_subjects = [s['name'] for s in subjects if s.get('attendance', 0) < 60]
        if low_attendance_subjects:
            factors.append(f'Low attendance in: {", ".join(low_attendance_subjects)}')
        
        if not factors:
            factors.append('Good overall performance')
        
        return factors