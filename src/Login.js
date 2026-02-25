import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from './firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check if Email is Verified
      if (!user.emailVerified) {
        await signOut(auth);
        Swal.fire({
          title: 'Email Not Verified',
          text: 'Please verify your email before logging in. Check your inbox for the verification link.',
          icon: 'warning',
          confirmButtonColor: '#1a4d8c',
          confirmButtonText: 'Resend Email'
        }).then((result) => {
          if (result.isConfirmed) {
            // Optional: You could trigger resend here if desired
            // For now, just a polite reminder
          }
        });
        setLoading(false);
        return;
      }

      // 3. Success Alert
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: user.displayName || "User",
        email: user.email,
        createdAt: serverTimestamp()
      }, { merge: true });

      Swal.fire({
        title: 'Success!',
        text: 'Login Successful!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      navigate('/home');
    } catch (error) {
      Swal.fire({
        title: 'Login Failed',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#1a4d8c',
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

          <button
            type="button"
            disabled={loading}
            className="btn w-100 fw-bold text-dark mt-2 border d-flex align-items-center justify-content-center"
            style={{ backgroundColor: '#fff', padding: '12px' }}
            onClick={handleGoogleLogin}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
            Sign in with Google
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