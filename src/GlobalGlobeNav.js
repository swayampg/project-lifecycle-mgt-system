import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import './GlobalGlobeNav.css';

const GlobalGlobeNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Hide on login, signup, and reset-password pages
    const hideOnRoutes = ['/', '/signup', '/reset-password', '/feedback'];
    if (!user || hideOnRoutes.includes(location.pathname)) {
        return null;
    }

    return (
        <div className="global-globe-nav">
            <button
                className="globe-nav-btn"
                onClick={() => navigate('/completed-projects')}
                title="Global Completed Projects"
            >
                <Globe size={28} />
            </button>
            <span className="nav-label">Global Archive</span>
        </div>
    );
};

export default GlobalGlobeNav;
