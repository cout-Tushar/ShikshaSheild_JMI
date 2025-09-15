import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import MentorDashboard from './components/MentorDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false); // ✅ new state

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // ✅ handlers to switch forms
  const switchToRegister = () => setShowRegister(true);
  const switchToLogin = () => setShowRegister(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          showRegister ? (
            <Register 
              onRegister={handleLogin} 
              switchToLogin={switchToLogin} 
            />
          ) : (
            <Login 
              onLogin={handleLogin} 
              switchToRegister={switchToRegister} 
            />
          )
        ) : (
          <>
            <nav className="bg-blue-600 text-white p-4">
              <div className="container mx-auto flex justify-between items-center">
                <div className='flex gap-2 justify-normal items-center'>
                  <img className='h-[35px]' src="shield.png" alt="" />
                  <h1 className="text-xl font-bold">शिक्षाShield</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span>Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </nav>
            
            <main className="container mx-auto py-6">
              {user.role === 'student' ? (
                <StudentDashboard />
              ) : (
                <MentorDashboard />
              )}
            </main>

            <footer className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="text-center">
                  <p className="text-blue-100 text-sm ">
                    © 2025 <span className='font-bold'>शिक्षाShield</span> . All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
