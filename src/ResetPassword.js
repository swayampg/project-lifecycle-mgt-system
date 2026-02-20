import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("A password reset link has been sent to your email!");
      navigate('/'); // Go back to login after sending
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="login-card text-center">
        <h1 className="welcome-text" style={{ color: '#1a4d8c', marginBottom: '30px' }}>Reset Password</h1>
        
        <form onSubmit={handleReset}>
          <div className="mb-4 text-start">
            <label className="fw-bold small text-secondary">Email Address</label>
            <input 
              type="email" 
              className="form-control bg-light border-0" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn w-100 fw-bold text-white mb-4" 
            style={{ backgroundColor: '#1a4d8c', padding: '12px' }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button 
            type="button" 
            className="btn btn-link w-100 text-muted text-decoration-none" 
            onClick={() => navigate('/')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;