import React, { useState } from 'react';
import { auth } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // We can reuse the same CSS!

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account Created Successfully!");
            navigate('/'); // Take them back to Login to sign in
        } catch (error) {
            alert("Signup Failed: " + error.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="shape-left"></div>
            <div className="shape-right"></div>
            <div className="login-card">
                <h1 className="welcome-text">Join Us !</h1>
                <form onSubmit={handleSignup}>
                    <div className="mb-3 text-start">
                        <label className="fw-bold small text-secondary">Full Name</label>
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Enter username"
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 text-start">
                        <label className="fw-bold small text-secondary">Email Address</label>
                        <input
                            type="email"
                            className="form-control bg-light border-0"
                            placeholder="Enter email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3 text-start">
                        <label className="fw-bold small text-secondary">Password</label>
                        <input type="password" className="form-control bg-light border-0" placeholder="********" onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn w-100 fw-bold text-white" style={{ backgroundColor: '#1a4d8c' }}>
                        Create Account
                    </button>
                    <button type="button" className="btn btn-link w-100 mt-2 text-decoration-none text-muted" onClick={() => navigate('/')}>
                        Already have an account? Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;