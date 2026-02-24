import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Swal from 'sweetalert2'; // 1. Import SweetAlert2
import './Login.css';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Success Alert
      Swal.fire({
        title: 'Success!',
        text: 'Login Successful!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      navigate('/home');
    } catch (error) {
      // 3. Error Alert
      Swal.fire({
        title: 'Login Failed',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#1a4d8c', // Matches your button color
        confirmButtonText: 'Try Again'
      });
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
            <label className="fw-bold small text-secondary">
              Email Address
            </label>
            <input
              type="email"
              className="form-control bg-light border-0"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-1 text-start">
            <label className="fw-bold small text-secondary">
              Password
            </label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control bg-light border-0"
                placeholder="********"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="input-group-text bg-light border-0"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </span>
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
            <button
              type="button"
              className="btn btn-link p-0 fw-bold text-decoration-none"
              style={{ color: '#1a4d8c' }}
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
            <br />
            <button
              type="button"
              className="btn btn-link p-0 text-muted text-decoration-none small"
              onClick={() => navigate('/reset-password')}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;