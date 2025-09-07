const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { auth, requireRole } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const { parseCSV } = require('../utils/csvParser');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get student's own data
router.get('/me', auth, requireRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({ message: 'Student data not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all students (mentor only)
router.get('/', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'name email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific student (mentor only)
router.get('/:id', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Analyze student risk
router.post('/analyze/:id', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Call ML service
    try {
      const mlResponse = await axios.post('http://localhost:5001/analyze', {
        subjects: student.subjects,
        feesPaid: student.feesPaid
      });

      // Update student with ML results
      student.riskLevel = mlResponse.data.riskLevel;
      student.predictedRiskScore = mlResponse.data.predictedRiskScore;
      await student.save();

      res.json(student);
    } catch (mlError) {
      console.log('ML service not available, using fallback analysis');
      // Fallback analysis if ML service is not running
      const avgAttendance = student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length;
      const avgMarks = student.subjects.reduce((sum, s) => sum + s.marks, 0) / student.subjects.length;
      
      let riskScore = 0;
      if (avgAttendance < 75) riskScore += 0.3;
      if (avgMarks < 60) riskScore += 0.3;
      if (!student.feesPaid) riskScore += 0.2;
      
      student.riskLevel = riskScore > 0.6 ? 'High' : riskScore > 0.3 ? 'Medium' : 'Low';
      student.predictedRiskScore = riskScore;
      await student.save();
      
      res.json(student);
    }
  } catch (error) {
    console.error('Error analyzing student:', error.message);
    res.status(500).json({ message: 'Error analyzing student risk' });
  }
});

// Upload CSV (mentor only)
router.post('/upload-csv', auth, requireRole(['mentor']), upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const studentsData = await parseCSV(req.file.path);
    const results = [];

    for (const studentData of studentsData) {
      try {
        // Find or create user
        let user = await User.findOne({ email: studentData.email });
        if (!user) {
          user = new User({
            name: studentData.name,
            email: studentData.email,
            password: 'defaultPassword123',
            role: 'student'
          });
          await user.save();
        }

        // Find or create student record
        let student = await Student.findOne({ userId: user._id });
        if (!student) {
          student = new Student({ userId: user._id, subjects: [] });
        }

        // Update student data
        student.subjects = studentData.subjects;
        student.feesPaid = studentData.feesPaid;

        // Simple fallback risk analysis
        const avgAttendance = studentData.subjects.reduce((sum, s) => sum + s.attendance, 0) / studentData.subjects.length;
        const avgMarks = studentData.subjects.reduce((sum, s) => sum + s.marks, 0) / studentData.subjects.length;
        
        let riskScore = 0;
        if (avgAttendance < 75) riskScore += 0.3;
        if (avgMarks < 60) riskScore += 0.3;
        if (!studentData.feesPaid) riskScore += 0.2;
        
        student.riskLevel = riskScore > 0.6 ? 'High' : riskScore > 0.3 ? 'Medium' : 'Low';
        student.predictedRiskScore = riskScore;

        await student.save();
        results.push({ success: true, student: studentData.name });
      } catch (studentError) {
        results.push({ success: false, student: studentData.name, error: studentError.message });
      }
    }

    res.json({ message: 'CSV processed', results });
  } catch (error) {
    res.status(500).json({ message: 'Error processing CSV', error: error.message });
  }
});

// Update student (mentor only)
router.put('/:id', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const { subjects, feesPaid } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { subjects, feesPaid },
      { new: true }
    ).populate('userId', 'name email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;