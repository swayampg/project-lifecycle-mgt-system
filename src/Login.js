import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Added loading state

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Verifies the user with Firebase Authentication
    await signInWithEmailAndPassword(auth, email, password);
    
    alert("Login Successful!");
    navigate('/home'); // Redirects to Home as you requested
  } catch (error) {
    // Common errors: 'auth/user-not-found' or 'auth/wrong-password'
    alert("Login Failed: " + error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <div className="shape-left"></div>
      <div className="shape-right"></div>

      <div className="login-card">
        <h1 className="welcome-text">Welcome !</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label className="fw-bold small text-secondary">Email Address</label>
            <input
              type="email"
              className="form-control bg-light border-0"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-1 text-start">
            <label className="fw-bold small text-secondary">Password</label>
            <div className="input-group">
              <input
                type="password"
                className="form-control bg-light border-0"
                placeholder="********"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn w-100 fw-bold text-white mt-4" 
            style={{ backgroundColor: '#1a4d8c', padding: '12px' }}
          >
            {loading ? "Checking..." : "Log In"}
          </button>

          <div className="text-center mt-3">
             <button type="button" className="btn btn-link p-0 fw-bold text-decoration-none" style={{ color: '#1a4d8c' }} onClick={() => navigate('/signup')}>
                Sign Up
             </button>
             <br />
             <button type="button" className="btn btn-link p-0 text-muted text-decoration-none small" onClick={() => navigate('/reset-password')}>
                Forgot Password?
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;