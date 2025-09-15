import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import StudentTable from './StudentTable';
import Charts from './Charts';
import EditStudentModal from "./EditStudentModal";

const MentorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentApi.getAllStudents();
      setStudents(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    try {
      setUploadStatus('Uploading...');
      const response = await studentApi.uploadCSV(formData);
      setUploadStatus(`Upload successful! Processed ${response.data.results.length} records`);
      setSelectedFile(null);
      fetchStudents(); // Refresh data
    } catch (error) {
      setUploadStatus(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleAnalyzeStudent = async (studentId) => {
    try {
      await studentApi.analyzeStudent(studentId);
      fetchStudents(); // Refresh data
    } catch (error) {
      console.error('Error analyzing student:', error);
    }
  };

  const getStats = () => {
    if (!students.length) return { total: 0, high: 0, medium: 0, low: 0 };
    
    return {
      total: students.length,
      high: students.filter(s => s.riskLevel === 'High').length,
      medium: students.filter(s => s.riskLevel === 'Medium').length,
      low: students.filter(s => s.riskLevel === 'Low').length
    };
  };

  const stats = getStats();

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Mentor Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Students</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">High Risk</h3>
            <p className="text-2xl font-bold text-red-600">{stats.high}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Medium Risk</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.medium}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Low Risk</h3>
            <p className="text-2xl font-bold text-green-600">{stats.low}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold mb-3">Upload Student Data (CSV)</h3>
          <form onSubmit={handleFileUpload} className="flex items-center space-x-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Upload
            </button>
          </form>
          {uploadStatus && (
            <div className={`mt-2 text-sm ${uploadStatus.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
              {uploadStatus}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-600">
            CSV Format: name, email, subject, attendance, marks, feesPaid
          </div>
        </div>
      </div>

      <Charts students={students} />
      
      <StudentTable 
        students={students} 
        onAnalyze={handleAnalyzeStudent}
        onRefresh={fetchStudents}
      />
    </div>
  );
};

export default MentorDashboard;