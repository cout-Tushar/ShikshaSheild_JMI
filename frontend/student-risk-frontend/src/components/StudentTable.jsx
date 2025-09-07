import React, { useState } from 'react';

const StudentTable = ({ students, onAnalyze, onRefresh }) => {
  const [expandedStudent, setExpandedStudent] = useState(null);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleExpanded = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">All Students</h3>
        <button
          onClick={onRefresh}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          Refresh
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Subjects</th>
              <th className="px-4 py-2 text-left">Avg Attendance</th>
              <th className="px-4 py-2 text-left">Avg Marks</th>
              <th className="px-4 py-2 text-left">Fees</th>
              <th className="px-4 py-2 text-left">Risk Level</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const avgAttendance = student.subjects.length > 0 
                ? (student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length).toFixed(1)
                : 0;
              const avgMarks = student.subjects.length > 0
                ? (student.subjects.reduce((sum, s) => sum + s.marks, 0) / student.subjects.length).toFixed(1)
                : 0;

              return (
                <React.Fragment key={student._id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{student.userId?.name || 'N/A'}</td>
                    <td className="px-4 py-2">{student.userId?.email || 'N/A'}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleExpanded(student._id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {student.subjects.length} subjects {expandedStudent === student._id ? '▼' : '▶'}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        avgAttendance >= 75 ? 'bg-green-100 text-green-800' : 
                        avgAttendance >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {avgAttendance}%
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        avgMarks >= 70 ? 'bg-green-100 text-green-800' : 
                        avgMarks >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {avgMarks}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {student.feesPaid ? (
                        <span className="text-green-600">✅ Paid</span>
                      ) : (
                        <span className="text-red-600">❌ Outstanding</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${getRiskColor(student.riskLevel)}`}>
                        {student.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onAnalyze(student._id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                  
                  {expandedStudent === student._id && (
                    <tr>
                      <td colSpan="8" className="px-4 py-2 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {student.subjects.map((subject, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="font-medium">{subject.name}</div>
                              <div className="text-sm text-gray-600">
                                Attendance: {subject.attendance}% | Marks: {subject.marks}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;