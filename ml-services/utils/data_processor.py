import numpy as np

class DataProcessor:
    def __init__(self):
        pass
    
    def process_subjects(self, subjects):
        """
        Process subjects data to calculate averages and statistics
        
        Args:
            subjects (list): List of subject dictionaries
            
        Returns:
            dict: Processed data with averages
        """
        if not subjects or len(subjects) == 0:
            return None
        
        try:
            attendances = []
            marks = []
            
            for subject in subjects:
                if isinstance(subject, dict):
                    attendance = subject.get('attendance', 0)
                    mark = subject.get('marks', 0)
                    
                    # Validate data
                    if isinstance(attendance, (int, float)) and isinstance(mark, (int, float)):
                        attendances.append(max(0, min(100, attendance)))
                        marks.append(max(0, min(100, mark)))
            
            if not attendances or not marks:
                return None
            
            return {
                'avg_attendance': np.mean(attendances),
                'avg_marks': np.mean(marks),
                'subject_count': len(subjects),
                'attendance_std': np.std(attendances) if len(attendances) > 1 else 0,
                'marks_std': np.std(marks) if len(marks) > 1 else 0,
                'min_attendance': np.min(attendances),
                'max_attendance': np.max(attendances),
                'min_marks': np.min(marks),
                'max_marks': np.max(marks)
            }
            
        except Exception as e:
            print(f"Error processing subjects: {str(e)}")
            return None
    
    def validate_subject_data(self, subject):
        """Validate individual subject data"""
        if not isinstance(subject, dict):
            return False
        
        required_fields = ['name', 'attendance', 'marks']
        for field in required_fields:
            if field not in subject:
                return False
        
        # Check data types and ranges
        attendance = subject.get('attendance')
        marks = subject.get('marks')
        
        if not isinstance(attendance, (int, float)) or attendance < 0 or attendance > 100:
            return False
        
        if not isinstance(marks, (int, float)) or marks < 0 or marks > 100:
            return False
        
        return True