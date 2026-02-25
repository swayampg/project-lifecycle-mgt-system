import React, { useState } from 'react';
import { auth, db, googleProvider } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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

            // 3. Send Verification Email
            await sendEmailVerification(user);

            // 4. Sign Out until verified
            await signOut(auth);

            Swal.fire({
                title: 'Verify Your Email',
                text: 'A verification link has been sent to your email. Please verify before logging in.',
                icon: 'info',
                confirmButtonColor: '#1a4d8c',
                confirmButtonText: 'Got it'
            });
            navigate('/');
        } catch (error) {
            Swal.fire({
                title: 'Signup Failed',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#1a4d8c',
                confirmButtonText: 'Try Again'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
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
                text: 'Account Created Successfully!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/');
        } catch (error) {
            Swal.fire({
                title: 'Google Signup Failed',
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
                    <button type="button" disabled={loading} className="btn w-100 fw-bold text-dark mt-2 border d-flex align-items-center justify-content-center" style={{ backgroundColor: '#fff' }} onClick={handleGoogleSignup}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', marginRight: '10px' }} />
                        Sign up with Google
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