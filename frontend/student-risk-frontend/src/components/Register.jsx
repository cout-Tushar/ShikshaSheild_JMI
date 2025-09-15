import React, { useState } from 'react';
import { authApi } from '../services/api';

const Register = ({ onRegister, switchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student', // default role
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // ✅ Front-end mentor code check
  if (formData.role === 'mentor') {
    const SECRET_CODE = 'mentor123'; // hardcoded code
    if (formData.mentorCode !== SECRET_CODE) {
      setError('Invalid mentor secret code');
      setLoading(false);
      return;
    }
  }

  try {
    const response = await authApi.register(formData);
    onRegister(response.data.user, response.data.token);
  } catch (err) {
    setError(err.response?.data?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <button
                            type="button"
                            onClick={switchToLogin}
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            sign in to your account
                        </button>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="student">Student</option>
                                    <option value="mentor">Mentor</option>
                                </select>
                            </div>
                        </div>
                        {formData.role === 'mentor' && (
                            <div>
                                <label>Mentor Secret Code</label>
                                <input
                                    type="password"
                                    name="mentorCode"
                                    required
                                    value={formData.mentorCode || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        )}
                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
