import React, { useState, useEffect } from 'react';
import { studentApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const response = await studentApi.getMyData();
      setStudentData(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-600 text-center py-8">{error}</div>;
  if (!studentData) return <div className="text-center py-8">No data found</div>;

  const chartData = studentData.subjects.map(subject => ({
    subject: subject.name,
    attendance: subject.attendance,
    marks: subject.marks
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">My Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Subjects</h3>
            <p className="text-2xl font-bold text-blue-600">{studentData.subjects.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Average Attendance</h3>
            <p className="text-2xl font-bold text-green-600">
              {(studentData.subjects.reduce((sum, s) => sum + s.attendance, 0) / studentData.subjects.length).toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">Average Marks</h3>
            <p className="text-2xl font-bold text-purple-600">
              {(studentData.subjects.reduce((sum, s) => sum + s.marks, 0) / studentData.subjects.length).toFixed(1)}
            </p>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${getRiskColor(studentData.riskLevel)}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Risk Level: {studentData.riskLevel}</h3>
              <p className="text-sm">Risk Score: {(studentData.predictedRiskScore * 100).toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm">Fee Status: {studentData.feesPaid ? '✅ Paid' : '❌ Outstanding'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Subject Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Attendance (%)</th>
                <th className="px-4 py-2 text-left">Marks</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {studentData.subjects.map((subject, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-medium">{subject.name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      subject.attendance >= 75 ? 'bg-green-100 text-green-800' : 
                      subject.attendance >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {subject.attendance}%
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      subject.marks >= 70 ? 'bg-green-100 text-green-800' : 
                      subject.marks >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {subject.marks}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {subject.marks >= 40 ? (
                      <span className="text-green-600">✅ Pass</span>
                    ) : (
                      <span className="text-red-600">❌ Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Performance Chart</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendance" fill="#8884d8" name="Attendance %" />
            <Bar dataKey="marks" fill="#82ca9d" name="Marks" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudentDashboard;