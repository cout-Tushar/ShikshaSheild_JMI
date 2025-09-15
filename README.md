# शिक्षाShield – Student Risk Detection System

**शिक्षाShield** is an intelligent platform designed to identify students at risk based on academic performance, attendance, and fee status. It uses machine learning to help educational institutions proactively support students who may need guidance.  

---

## Features

- ✅ **Automated Risk Analysis** – Detects students at academic or financial risk.  
- ✅ **Data-Driven Insights** – Evaluates metrics like attendance, marks, and fees.  
- ✅ **CSV Import** – Upload student data in bulk for quick analysis.  
- ✅ **Automated Notifications** – Sends emails to students or guardians when risks are detected.  
- ✅ **Role-Based Access** – Secure access for mentors, admins, and students.  
- ✅ **Web Dashboard** – Easy-to-use interface to manage and view student data.  

---

## Tech Stack

- **Backend:** Node.js, Express  
- **Frontend:** (Add your frontend tech here, e.g., React / HTML/CSS/JS)  
- **Database:** MongoDB  
- **Machine Learning:** Python (scikit-learn)  
- **Email Notifications:** SendGrid / Nodemailer  
- **Scheduler:** node-cron for automated tasks  

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shikshashield.git
cd shikshashield

# Install backend dependencies
cd backend
npm install

# Install Python dependencies for ML services
cd ../ml-services
pip install -r requirements.txt

# Set up environment variables
export MONGO_URI="your_mongodb_connection_string"
export SENDGRID_API_KEY="your_sendgrid_api_key"
export EMAIL_SENDER="your_verified_email"

# Start the backend server
cd ../backend
npm start

# Start ML services (if separate)
cd ../ml-services
python app.py

# Access the application at http://localhost:5000

