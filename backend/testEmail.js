const sendEmail = require('./utils/sendEmail');

(async () => {
  try {
    await sendEmail(
      'suhanakesharwani@gmail.com', // replace with your email
      'Test Email from शिक्षाShield',
      'This is a test email to verify SendGrid integration.',
      '<strong>This is a test email to verify SendGrid integration.</strong>'
    );
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
})();
