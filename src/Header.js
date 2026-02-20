import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ fullName: 'User', role: 'Member' });

    // Fetch user profile data from Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <header className="main-header d-flex justify-content-between align-items-center">
            {/* --- PROFILE SECTION --- */}
            <div
                className="header-profile-section d-flex align-items-center"
                // 🔹 FIXED: Removed duplicate onClick and navigate to Profile Overview
                onClick={() => navigate('/profile-overview')}
                style={{ cursor: 'pointer' }}
            >
                <img
                    src="https://via.placeholder.com/150"
                    alt="Profile"
                    className="me-2 rounded-circle"
                    style={{ width: '35px', height: '35px' }}
                />
                <div>
                    <div className="fw-bold small">{userData.fullName}</div>
                    <div className="small opacity-75" style={{ fontSize: '11px' }}>
                        {userData.role || 'Member'}
                    </div>
                </div>
            </div>

            {/* --- SEARCH BOX --- */}
            <div className="header-search-box">
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                        <Search size={14} />
                    </span>
                    <input 
                        type="text" 
                        className="form-control border-start-0 shadow-none" 
                        placeholder="Search" 
                    />
                </div>
            </div>

            {/* --- ACTION ICONS --- */}
            <div className="header-actions d-flex align-items-center gap-3">
                {/* 🔹 FIXED: Connected Bell icon to the Notifications page */}
                <Bell 
                    size={20} 
                    className="header-icon cursor-pointer" 
                    onClick={() => navigate('/notifications')} 
                    style={{ cursor: 'pointer' }}
                />
                <Settings 
                    size={20} 
                    className="header-icon cursor-pointer" 
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </header>
    );
};

export default Header;