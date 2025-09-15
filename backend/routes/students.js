const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cron = require('node-cron');
const { auth, requireRole } = require('../middleware/auth');
const Student = require('../models/Student');
const User = require('../models/User');
const { parseCSV } = require('../utils/csvParser');
const sendEmail = require('../utils/sendEmail');

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

// Example: trigger alert email
router.post('/alert-student', async (req, res) => {
  const { email, riskLevel } = req.body;

  try {
    await sendEmail(
      email,
      '⚠️ High Risk Alert',
      `Dear Student, your current risk level is: ${riskLevel}. Please reach out to your mentor.`
    );

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email' });
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

async function sendAutomatedAlerts() {
  try {
    const highRiskStudents = await Student.find({ riskLevel: 'High' })
      .populate('userId', 'name email')
      .lean();

    if (!highRiskStudents.length) return;

    const mentors = await User.find({ role: 'mentor' }).select('name email').lean();

    // Send emails to high-risk students
    for (const student of highRiskStudents) {
      const studentEmailContent = generateStudentEmailContent(student);
      await sendEmail(
        student.userId.email,
        '⚠️ Academic Performance Alert - Immediate Action Required',
        studentEmailContent.text,
        studentEmailContent.html
      );
      console.log(`📧 Email sent to student: ${student.userId.name}`);
    }

    // Send summary email to mentors
    const mentorEmailContent = generateMentorEmailContent(highRiskStudents);
    for (const mentor of mentors) {
      await sendEmail(
        mentor.email,
        `🚨 High-Risk Students Report - ${highRiskStudents.length} Students Need Attention`,
        mentorEmailContent.text,
        mentorEmailContent.html
      );
      console.log(`📧 Email sent to mentor: ${mentor.name}`);
    }
  } catch (err) {
    console.error('❌ Error sending automated alerts:', err.message);
  }
}



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

     setTimeout(async () => {
        console.log('🕒 Sending automated emails 10 seconds after CSV upload...');
        await sendAutomatedAlerts();
      }, 10 * 1000); 
      

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

// ========== AUTOMATED EMAIL SYSTEM ==========

// Get all high-risk students with their email data
router.get('/high-risk', auth, requireRole(['mentor']), async (req, res) => {
  try {
    const highRiskStudents = await Student.find({ riskLevel: 'High' })
      .populate('userId', 'name email')
      .lean();

    const studentsData = highRiskStudents.map(student => ({
      id: student._id,
      name: student.userId.name,
      email: student.userId.email,
      riskScore: student.predictedRiskScore,
      subjects: student.subjects,
      feesPaid: student.feesPaid,
      lastUpdated: student.updatedAt
    }));

    res.json({
      count: studentsData.length,
      students: studentsData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching high-risk students', error: error.message });
  }
});

// Send automated alerts to high-risk students and mentors
router.post('/send-automated-alerts', auth, requireRole(['mentor']), async (req, res) => {
  try {
    // Fetch high-risk students
    const highRiskStudents = await Student.find({ riskLevel: 'High' })
      .populate('userId', 'name email')
      .lean();

    if (highRiskStudents.length === 0) {
      return res.json({ message: 'No high-risk students found', studentEmails: 0, mentorEmails: 0 });
    }

    // Fetch all mentors
    const mentors = await User.find({ role: 'mentor' }).select('name email').lean();

    let studentEmailsSent = 0;
    let mentorEmailsSent = 0;
    const errors = [];

    // Send emails to high-risk students
    for (const student of highRiskStudents) {
      try {
        const studentEmailContent = generateStudentEmailContent(student);
        await sendEmail(
          student.userId.email,
          '⚠️ Academic Performance Alert - Immediate Action Required',
          studentEmailContent.text,
          studentEmailContent.html
        );
        studentEmailsSent++;
        console.log(`📧 Email sent to student: ${student.userId.name}`);
      } catch (error) {
        errors.push(`Failed to send email to ${student.userId.name}: ${error.message}`);
      }
    }

    // Send summary email to all mentors
    const mentorEmailContent = generateMentorEmailContent(highRiskStudents);
    for (const mentor of mentors) {
      try {
        await sendEmail(
          mentor.email,
          `🚨 Weekly High-Risk Students Report - ${highRiskStudents.length} Students Need Attention`,
          mentorEmailContent.text,
          mentorEmailContent.html
        );
        mentorEmailsSent++;
        console.log(`📧 Email sent to mentor: ${mentor.name}`);
      } catch (error) {
        errors.push(`Failed to send email to mentor ${mentor.name}: ${error.message}`);
      }
    }

    res.json({
      message: 'Automated alerts sent successfully',
      studentEmails: studentEmailsSent,
      mentorEmails: mentorEmailsSent,
      highRiskCount: highRiskStudents.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    res.status(500).json({ message: 'Error sending automated alerts', error: error.message });
  }
});

// Schedule automated emails (run every Monday at 9 AM)
router.post('/schedule-emails', auth, requireRole(['mentor']), async (req, res) => {
  const { enabled = true, schedule = '0 9 * * 1' } = req.body; // Default: Every Monday at 9 AM

  if (enabled) {
    // Cancel existing scheduled job if any
    if (global.emailScheduler) {
      global.emailScheduler.stop();
    }

    // Create new scheduled job
    global.emailScheduler = cron.schedule(schedule, async () => {
      console.log('🕒 Running scheduled high-risk student email alerts...');
      
      try {
        // Fetch high-risk students
        const highRiskStudents = await Student.find({ riskLevel: 'High' })
          .populate('userId', 'name email')
          .lean();

        if (highRiskStudents.length === 0) {
          console.log('No high-risk students found for scheduled email');
          return;
        }

        // Fetch mentors
        const mentors = await User.find({ role: 'mentor' }).select('name email').lean();

        let emailsSent = 0;

        // Send to students
        for (const student of highRiskStudents) {
          try {
            const emailContent = generateStudentEmailContent(student);
            await sendEmail(
              student.userId.email,
              '⚠️ Weekly Academic Performance Alert',
              emailContent.text,
              emailContent.html
            );
            emailsSent++;
          } catch (error) {
            console.error(`Scheduled email failed for ${student.userId.name}:`, error.message);
          }
        }

        // Send to mentors
        const mentorEmailContent = generateMentorEmailContent(highRiskStudents);
        for (const mentor of mentors) {
          try {
            await sendEmail(
              mentor.email,
              `🚨 Weekly High-Risk Students Report - ${highRiskStudents.length} Students Need Attention`,
              mentorEmailContent.text,
              mentorEmailContent.html
            );
            emailsSent++;
          } catch (error) {
            console.error(`Scheduled email failed for mentor ${mentor.name}:`, error.message);
          }
        }

        console.log(`✅ Scheduled emails sent: ${emailsSent} total emails`);

      } catch (error) {
        console.error('❌ Scheduled email job failed:', error.message);
      }
    });

    global.emailScheduler.start();
    
    res.json({ 
      message: 'Email scheduling enabled', 
      schedule,
      nextRun: 'Every Monday at 9:00 AM'
    });
  } else {
    if (global.emailScheduler) {
      global.emailScheduler.stop();
      global.emailScheduler = null;
    }
    res.json({ message: 'Email scheduling disabled' });
  }
});

// Get scheduler status
router.get('/scheduler-status', auth, requireRole(['mentor']), (req, res) => {
  res.json({
    isActive: global.emailScheduler ? global.emailScheduler.running : false,
    schedule: global.emailScheduler ? 'Every Monday at 9:00 AM' : 'Not scheduled'
  });
});

// ========== EMAIL CONTENT GENERATORS ==========

function generateStudentEmailContent(student) {
  const avgAttendance = student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length;
  const avgMarks = student.subjects.reduce((sum, s) => sum + s.marks, 0) / student.subjects.length;
  
  const lowPerformanceSubjects = student.subjects.filter(s => s.attendance < 75 || s.marks < 60);
  
  const text = `Dear ${student.userId.name},

This is an important alert regarding your academic performance. Our system has identified you as a high-risk student requiring immediate attention.

Current Status:
- Risk Level: HIGH
- Risk Score: ${(student.predictedRiskScore * 100).toFixed(1)}%
- Average Attendance: ${avgAttendance.toFixed(1)}%
- Average Marks: ${avgMarks.toFixed(1)}%
- Fees Status: ${student.feesPaid ? 'Paid' : 'UNPAID'}

Subjects needing attention:
${lowPerformanceSubjects.map(s => `- ${s.name}: ${s.attendance}% attendance, ${s.marks}% marks`).join('\n')}

Immediate Actions Required:
1. Contact your mentor immediately
2. Attend all upcoming classes
3. ${!student.feesPaid ? 'Clear pending fees payment\n4. ' : ''}Schedule extra study sessions

Please take this alert seriously and reach out for support. We're here to help you succeed!

Best regards,
शिक्षाShield Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d32f2f; margin: 0; font-size: 24px;">⚠️ Academic Performance Alert</h1>
          <p style="color: #666; margin: 10px 0 0 0;">शिक्षाShield - Student Success System</p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; color: #856404;"><strong>Dear ${student.userId.name},</strong></p>
          <p style="margin: 10px 0 0 0; color: #856404;">You have been identified as a <strong>HIGH RISK</strong> student requiring immediate attention.</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">📊 Current Performance Status</h3>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>Risk Level:</span>
              <span style="color: #d32f2f; font-weight: bold;">HIGH (${(student.predictedRiskScore * 100).toFixed(1)}%)</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>Average Attendance:</span>
              <span style="color: ${avgAttendance < 75 ? '#d32f2f' : '#4caf50'}; font-weight: bold;">${avgAttendance.toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>Average Marks:</span>
              <span style="color: ${avgMarks < 60 ? '#d32f2f' : '#4caf50'}; font-weight: bold;">${avgMarks.toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span>Fees Status:</span>
              <span style="color: ${student.feesPaid ? '#4caf50' : '#d32f2f'}; font-weight: bold;">${student.feesPaid ? 'Paid' : 'UNPAID'}</span>
            </div>
          </div>
        </div>

        ${lowPerformanceSubjects.length > 0 ? `
        <div style="background: #ffebee; border: 1px solid #f8bbd9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="color: #c62828; margin: 0 0 10px 0;">⚠️ Subjects Needing Immediate Attention:</h4>
          ${lowPerformanceSubjects.map(s => `
            <div style="margin: 8px 0; padding: 8px; background: white; border-radius: 3px;">
              <strong>${s.name}</strong>: ${s.attendance}% attendance, ${s.marks}% marks
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #1565c0; margin: 0 0 15px 0;">🎯 Immediate Actions Required:</h3>
          <ol style="margin: 0; padding-left: 20px; color: #333;">
            <li style="margin: 8px 0;"><strong>Contact your mentor immediately</strong></li>
            <li style="margin: 8px 0;"><strong>Attend all upcoming classes</strong></li>
            ${!student.feesPaid ? '<li style="margin: 8px 0;"><strong>Clear pending fees payment</strong></li>' : ''}
            <li style="margin: 8px 0;"><strong>Schedule extra study sessions</strong></li>
          </ol>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
          <p style="color: #666; margin: 0;">Remember: We're here to help you succeed! 🌟</p>
          <p style="color: #333; margin: 10px 0 0 0; font-weight: bold;">Best regards,<br>शिक्षाShield Team</p>
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

function generateMentorEmailContent(highRiskStudents) {
  const totalStudents = highRiskStudents.length;
  const unpaidFeesCount = highRiskStudents.filter(s => !s.feesPaid).length;
  const lowAttendanceCount = highRiskStudents.filter(s => {
    const avg = s.subjects.reduce((sum, sub) => sum + sub.attendance, 0) / s.subjects.length;
    return avg < 75;
  }).length;

  const text = `Dear Mentor,

Weekly High-Risk Students Report

Summary:
- Total High-Risk Students: ${totalStudents}
- Students with Unpaid Fees: ${unpaidFeesCount}
- Students with Low Attendance: ${lowAttendanceCount}

High-Risk Students List:
${highRiskStudents.map((student, index) => {
  const avgAttendance = student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length;
  const avgMarks = student.subjects.reduce((sum, s) => sum + s.marks, 0) / student.subjects.length;
  
  return `${index + 1}. ${student.userId.name} (${student.userId.email})
   - Risk Score: ${(student.predictedRiskScore * 100).toFixed(1)}%
   - Avg Attendance: ${avgAttendance.toFixed(1)}%
   - Avg Marks: ${avgMarks.toFixed(1)}%
   - Fees: ${student.feesPaid ? 'Paid' : 'UNPAID'}`;
}).join('\n\n')}

Recommendation: Please reach out to these students immediately to provide necessary support and guidance.

Best regards,
शिक्षाShield System`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d32f2f; margin: 0; font-size: 28px;">🚨 Weekly High-Risk Students Report</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">शिक्षाShield - Mentor Dashboard</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 30px 0;">
          <div style="background: #ffebee; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f8bbd9;">
            <h2 style="color: #d32f2f; margin: 0; font-size: 32px;">${totalStudents}</h2>
            <p style="color: #c62828; margin: 5px 0 0 0; font-weight: bold;">High-Risk Students</p>
          </div>
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ffcc80;">
            <h2 style="color: #f57c00; margin: 0; font-size: 32px;">${unpaidFeesCount}</h2>
            <p style="color: #e65100; margin: 5px 0 0 0; font-weight: bold;">Unpaid Fees</p>
          </div>
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #ce93d8;">
            <h2 style="color: #7b1fa2; margin: 0; font-size: 32px;">${lowAttendanceCount}</h2>
            <p style="color: #6a1b9a; margin: 5px 0 0 0; font-weight: bold;">Low Attendance</p>
          </div>
        </div>

        <div style="margin: 30px 0;">
          <h2 style="color: #333; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 3px solid #667eea;">📋 Students Requiring Immediate Attention</h2>
          
          ${highRiskStudents.map((student, index) => {
            const avgAttendance = student.subjects.reduce((sum, s) => sum + s.attendance, 0) / student.subjects.length;
            const avgMarks = student.subjects.reduce((sum, s) => sum + s.marks, 0) / student.subjects.length;
            
            return `
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 5px solid #d32f2f;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                  <h3 style="color: #333; margin: 0; font-size: 18px;">${index + 1}. ${student.userId.name}</h3>
                  <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">${student.userId.email}</p>
                </div>
                <div style="background: #d32f2f; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  RISK: ${(student.predictedRiskScore * 100).toFixed(1)}%
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                  <div style="font-size: 18px; font-weight: bold; color: ${avgAttendance < 75 ? '#d32f2f' : '#4caf50'};">${avgAttendance.toFixed(1)}%</div>
                  <div style="font-size: 12px; color: #666;">Attendance</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                  <div style="font-size: 18px; font-weight: bold; color: ${avgMarks < 60 ? '#d32f2f' : '#4caf50'};">${avgMarks.toFixed(1)}%</div>
                  <div style="font-size: 12px; color: #666;">Avg Marks</div>
                </div>
                <div style="text-align: center; padding: 10px; background: white; border-radius: 5px;">
                  <div style="font-size: 18px; font-weight: bold; color: ${student.feesPaid ? '#4caf50' : '#d32f2f'};">${student.feesPaid ? 'PAID' : 'UNPAID'}</div>
                  <div style="font-size: 12px; color: #666;">Fees Status</div>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <div style="background: #e8f5e8; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #2e7d32; margin: 0 0 10px 0;">💡 Recommended Actions:</h3>
          <ul style="color: #333; margin: 0; padding-left: 20px;">
            <li style="margin: 5px 0;">Contact high-risk students immediately for one-on-one sessions</li>
            <li style="margin: 5px 0;">Review and update their study plans</li>
            <li style="margin: 5px 0;">Coordinate with parents/guardians if necessary</li>
            <li style="margin: 5px 0;">Schedule additional support sessions</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee;">
          <p style="color: #666; margin: 0;">Generated automatically by शिक्षाShield System</p>
          <p style="color: #333; margin: 10px 0 0 0; font-size: 14px;">This report was sent to all mentors</p>
        </div>
      </div>
    </div>
  `;

  return { text, html };
}

module.exports = router;