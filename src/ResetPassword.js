import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleSendOTP = (e) => {
        e.preventDefault();
        // Implementation for sending OTP would go here
        alert(`OTP sent to ${email}`);
    };

    return (
        <div className="auth-container">
            {/* Blue circles from your image */}
            <div className="shape-left"></div>
            <div className="shape-right"></div>

            <div className="login-card">
                <h2 className="welcome-text" style={{ fontSize: '2rem', marginBottom: '2rem' }}>Reset password</h2>

                <form onSubmit={handleSendOTP}>
                    <div className="mb-4 text-start">
                        <label className="fw-bold small text-secondary mb-2" style={{ fontSize: '0.85rem' }}>Email Address</label>
                        <input
                            type="email"
                            className="form-control bg-light border-0 py-3"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 fw-bold text-white py-3 mt-2"
                        style={{ backgroundColor: '#1a4d8c', borderRadius: '8px' }}
                    >
                        Send OTP
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            className="btn btn-link p-0 text-muted text-decoration-none small"
                            onClick={() => navigate('/')}
                        >
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>

            {/* Branding Logo at bottom left */}
            <div className="brand-footer">
                <div className="logo-placeholder">LOGO</div>
                <p className="brand-name">Project Lifecycle<br />Management System</p>
            </div>
        </div>
    );
};

export default ResetPassword;
