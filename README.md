# शिक्षाShield – Student Risk Detection System

**शिक्षाShield** is an intelligent platform designed to identify students at risk based on academic performance, attendance, and fee status. It uses Machine Learning to help educational institutions proactively support students who may need guidance.

---

## 🚀 Features

- ✅ **Automated Risk Analysis** – Detects students at academic or financial risk  
- ✅ **Data-Driven Insights** – Evaluates attendance, marks, and fee metrics  
- ✅ **CSV Import** – Upload student data in bulk for quick analysis  
- ✅ **Automated Notifications** – Sends emails to students or guardians when risks are detected  
- ✅ **Role-Based Access** – Secure access for mentors, admins, and students  
- ✅ **Web Dashboard** – Clean and easy-to-use interface to manage and view student data  

---

## 🛠 Tech Stack

- **Frontend:** React (Vite)  
- **Backend:** Node.js, Express  
- **Database:** MongoDB  
- **Machine Learning:** Python (scikit-learn)  
- **Email Notifications:** SendGrid / Nodemailer  
- **Scheduler:** node-cron  

---

## 📂 Project Structure

```
ShikshaSheild_JMI/
│
├── backend/                  # Express backend API
├── frontend/
│   └── student-risk-frontend/ # React (Vite) frontend
├── ml-services/              # Python ML services
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/cout-Tushar/ShikshaSheild_JMI.git
cd ShikshaSheild_JMI
```

---

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder and add:

```
MONGO_URI=your_mongodb_connection_string
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_SENDER=your_verified_email
```

Start backend server:

```bash
npm start
```

Backend runs on:

```
http://localhost:5000
```

---

### 3️⃣ Setup Frontend

```bash
cd ../frontend/student-risk-frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

### 4️⃣ Setup ML Services

```bash
cd ../../ml-services
pip install -r requirements.txt
python app.py
```

---

## 🌐 Application Overview

- Backend API → `http://localhost:5000`
- Frontend → `http://localhost:5173`
- ML Service → Runs separately via Python

---

## 🎯 Project Goal

The goal of **शिक्षाShield** is to help institutions take proactive action by identifying at-risk students early and enabling timely mentorship and intervention.

---

## 👨‍💻 Author

**Tushar Mishra & Suhana**  
GitHub: https://github.com/cout-Tushar
