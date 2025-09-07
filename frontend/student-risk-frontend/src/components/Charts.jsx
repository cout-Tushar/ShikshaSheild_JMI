import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ students }) => {
  const getRiskDistribution = () => {
    const distribution = { High: 0, Medium: 0, Low: 0 };
    students.forEach(student => {
      distribution[student.riskLevel] = (distribution[student.riskLevel] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([key, value]) => ({
      name: key,
      value,
      color: key === 'High' ? '#ef4444' : key === 'Medium' ? '#f59e0b' : '#10b981'
    }));
  };

  const getAttendanceVsRisk = () => {
    return students.map(student => {
      const avgAttendance = student.subjects.length > 0 
        ? student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length
        : 0;
      
      return {
        name: student.userId?.name?.split(' ')[0] || 'Unknown',
        attendance: Math.round(avgAttendance),
        riskScore: Math.round(student.predictedRiskScore * 100),
        riskLevel: student.riskLevel
      };
    });
  };

  const riskDistribution = getRiskDistribution();
  const attendanceVsRisk = getAttendanceVsRisk();

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Risk Level Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {riskDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Attendance vs Risk Score</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceVsRisk} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="attendance" fill="#8884d8" name="Attendance %" />
            <Bar dataKey="riskScore" fill="#82ca9d" name="Risk Score %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;