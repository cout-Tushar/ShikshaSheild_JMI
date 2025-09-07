const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/student_risk_db');
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});

    // Create mentor
    const mentor = new User({
      name: 'Dr. Nakul',
      email: 'mentor@example.com',
      password: 'password123',
      role: 'mentor'
    });
    await mentor.save();

    // Create students
    const studentUsers = [
      { name: 'Suhana', email: 'Suhana@example.com', password: 'password123', role: 'student' },
      { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'password123', role: 'student' },
      { name: 'Sushant Sharma', email: 'Sushant@example.com', password: 'password123', role: 'student' }
    ];

    const savedUsers = [];
    for (const userData of studentUsers) {
      const user = new User(userData);
      await user.save();
      savedUsers.push(user);
    }

    // Create student records
    const studentRecords = [
      {
        userId: savedUsers[0]._id,
        subjects: [
          { name: 'Mathematics', attendance: 85, marks: 78 },
          { name: 'Physics', attendance: 90, marks: 82 },
          { name: 'Chemistry', attendance: 75, marks: 65 }
        ],
        feesPaid: true,
        riskLevel: 'Low',
        predictedRiskScore: 0.2
      },
      {
        userId: savedUsers[1]._id,
        subjects: [
          { name: 'Mathematics', attendance: 65, marks: 55 },
          { name: 'Physics', attendance: 70, marks: 60 },
          { name: 'Chemistry', attendance: 60, marks: 50 }
        ],
        feesPaid: false,
        riskLevel: 'High',
        predictedRiskScore: 0.8
      },
      {
        userId: savedUsers[2]._id,
        subjects: [
          { name: 'Mathematics', attendance: 80, marks: 70 },
          { name: 'Physics', attendance: 75, marks: 68 },
          { name: 'Chemistry', attendance: 85, marks: 75 }
        ],
        feesPaid: true,
        riskLevel: 'Medium',
        predictedRiskScore: 0.4
      }
    ];

    for (const studentData of studentRecords) {
      const student = new Student(studentData);
      await student.save();
    }

   
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(seedData);