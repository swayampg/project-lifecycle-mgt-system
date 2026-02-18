import React, { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create user in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create the User Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: fullName,
                email: email,
                createdAt: serverTimestamp()
            });

            alert("Account Created Successfully!");
            navigate('/');
        } catch (error) {
            alert("Signup Failed: " + error.message);
        } finally {
            setLoading(false);
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
                            placeholder="Enter your name"
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
                    <button type="submit" disabled={loading} className="btn w-100 fw-bold text-white" style={{ backgroundColor: '#1a4d8c' }}>
                        {loading ? "Creating Account..." : "Create Account"}
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