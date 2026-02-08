import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import navigation
import { auth } from './firebaseConfig'; // 2. Import firebase
import { signInWithEmailAndPassword } from 'firebase/auth'; // 3. Import login tool
import './Login.css';

const Login = () => {
  // 4. DEFINE NAVIGATE (This fixes your error!)
  const navigate = useNavigate();

  // 5. Setup "States" to hold the user's input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6. Function to handle the Log In button click
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
      navigate('/dashboard'); 
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      {/* Blue circles from your image */}
      <div className="shape-left"></div>
      <div className="shape-right"></div>

      <div className="login-card">
        <h1 className="welcome-text">Welcome !</h1>
        
        {/* 7. Add onSubmit to the form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label className="fw-bold small text-secondary">Email Address</label>
            <input 
              type="email" 
              className="form-control bg-light border-0" 
              placeholder="Enter your email" 
              onChange={(e) => setEmail(e.target.value)} // Update email state
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
                  onChange={(e) => setPassword(e.target.value)} // Update password state
                  required 
                />
                <span className="input-group-text bg-light border-0">👁️</span>
            </div>
          </div>

          <p className="text-muted mb-4 text-start" style={{fontSize: '11px'}}>
            It must be a combination of minimum 8 letters, numbers, and symbols.
          </p>
          
          <button type="submit" className="btn w-100 fw-bold text-white" style={{backgroundColor: '#1a4d8c', padding: '12px'}}>
            Log In
          </button>

          <div className="text-center mt-3">
            <p className="small">
                <span className="text-muted">Don't have an account? </span>
                <button 
                  type="button" 
                  className="btn btn-link p-0 fw-bold text-decoration-none" 
                  style={{color: '#1a4d8c', fontSize: '13px'}}
                  onClick={() => navigate('/signup')} // 🔹 This will now work!
                >
                    Sign Up
                </button>
            </p>
            <button type="button" className="btn btn-link p-0 text-muted text-decoration-none" style={{fontSize: '12px'}}>
                Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {/* Branding Logo at bottom left */}
      <div className="brand-footer">
        <div className="logo-placeholder">LOGO</div>
        <p className="brand-name">Project Lifecycle<br/>Management System</p>
      </div>
    </div>
  );
};

export default Login;