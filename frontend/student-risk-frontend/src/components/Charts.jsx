import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ students }) => {
  const [hoveredRisk, setHoveredRisk] = useState(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);

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
    let data = students.map(student => {
      const avgAttendance = student.subjects.length > 0 
        ? student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length
        : 0;
            
      return {
        name: student.userId?.name?.split(' ')[0] || student.name?.split(' ')[0] || 'Unknown',
        attendance: Math.round(avgAttendance),
        riskScore: Math.round((student.predictedRiskScore || 0) * 100),
        riskLevel: student.riskLevel || 'Low',
        fullName: student.userId?.name || student.name || 'Unknown Student'
      };
    });

    // Filter by selected risk level if any
    if (selectedRiskLevel) {
      data = data.filter(student => student.riskLevel === selectedRiskLevel);
    }

    return data;
  };

  const riskDistribution = getRiskDistribution();
  const attendanceVsRisk = getAttendanceVsRisk();

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold" style={{ color: data.payload.color }}>
            {data.payload.name} Risk Level
          </p>
          <p className="text-gray-700">
            Students: <span className="font-bold">{data.value}</span>
          </p>
          <p className="text-gray-700">
            Percentage: <span className="font-bold">{((data.value / students.length) * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const student = attendanceVsRisk.find(s => s.name === label);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{student?.fullName || label}</p>
          <p className="text-blue-600">
            Attendance: <span className="font-bold">{payload[0]?.value}%</span>
          </p>
          <p className="text-green-600">
            Risk Score: <span className="font-bold">{payload[1]?.value}%</span>
          </p>
          <p className={`font-medium ${
            student?.riskLevel === 'High' ? 'text-red-500' :
            student?.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'
          }`}>
            Risk Level: {student?.riskLevel}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle pie chart click
  const handlePieClick = (data) => {
    setSelectedRiskLevel(selectedRiskLevel === data.name ? null : data.name);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Distribution Pie Chart */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Risk Level Distribution</h3>
          {selectedRiskLevel && (
            <button 
              onClick={() => setSelectedRiskLevel(null)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filter
            </button>
          )}
        </div>
        
        {selectedRiskLevel && (
          <div className="mb-4 p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Filtering by: <span className="font-semibold">{selectedRiskLevel}</span> risk level
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={riskDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={hoveredRisk ? 85 : 80}
              fill="#8884d8"
              dataKey="value"
              onClick={handlePieClick}
              onMouseEnter={(data) => setHoveredRisk(data.name)}
              onMouseLeave={() => setHoveredRisk(null)}
              style={{ cursor: 'pointer' }}
            >
              {riskDistribution.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke={hoveredRisk === entry.name ? '#333' : 'none'}
                  strokeWidth={hoveredRisk === entry.name ? 2 : 0}
                  style={{
                    filter: selectedRiskLevel && selectedRiskLevel !== entry.name ? 'opacity(0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Interactive legend */}
        <div className="flex justify-center space-x-4 mt-4">
          {riskDistribution.map((entry, index) => (
            <div
              key={entry.name}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded-md transition-all duration-200 ${
                selectedRiskLevel === entry.name ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              onClick={() => handlePieClick(entry)}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance vs Risk Bar Chart */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">
          Attendance vs Risk Score
          {selectedRiskLevel && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({selectedRiskLevel} Risk Only)
            </span>
          )}
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={attendanceVsRisk} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(e) => {
              if (e && e.activeLabel) {
                setHoveredStudent(e.activeLabel);
              }
            }}
            onMouseLeave={() => setHoveredStudent(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar 
              dataKey="attendance" 
              fill="#8884d8" 
              name="Attendance %"
              radius={[4, 4, 0, 0]}
              style={{
                filter: hoveredStudent ? 'brightness(1.1)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
            <Bar 
              dataKey="riskScore" 
              fill="#82ca9d" 
              name="Risk Score %"
              radius={[4, 4, 0, 0]}
              style={{
                filter: hoveredStudent ? 'brightness(1.1)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="text-center">
            <p className="font-semibold text-gray-800">
              {attendanceVsRisk.length}
            </p>
            <p>Students Shown</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800">
              {attendanceVsRisk.length > 0 ? 
                Math.round(attendanceVsRisk.reduce((sum, s) => sum + s.attendance, 0) / attendanceVsRisk.length) 
                : 0}%
            </p>
            <p>Avg Attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;