import React, { useState, useEffect } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ fullName: 'User', role: 'Member' });

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
            {/* Profile Section */}
            <div
                className="header-profile-section d-flex align-items-center cursor-pointer"
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer' }}
            >
                <img
                    src="https://via.placeholder.com/150"
                    alt="Profile"
                    className="me-2"
                />
                <div>
                    <div className="fw-bold small">{userData.fullName}</div>
                    <div className="small opacity-75" style={{ fontSize: '11px' }}>{userData.role || 'Member'}</div>
                </div>
            </div>

            {/* Search Box */}
            <div className="header-search-box">
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white"><Search size={14} /></span>
                    <input type="text" className="form-control" placeholder="Search" />
                </div>
            </div>

            {/* Action Icons */}
            <div className="header-actions d-flex align-items-center gap-3">
                <Bell size={20} className="header-icon" />
                <Settings size={20} className="header-icon" />
            </div>
        </header>
    );
};

export default Header;
