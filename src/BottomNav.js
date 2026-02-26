import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Layers, Activity, Grid, Presentation } from 'lucide-react';
import { auth } from './firebaseConfig';
import { getUserRoleInProject } from './services/db_services';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);

    useEffect(() => {
        const fetchRole = async () => {
            const user = auth.currentUser;
            const selectedProjectId = localStorage.getItem('selectedProjectId');
            if (user && selectedProjectId) {
                const userRole = await getUserRoleInProject(selectedProjectId, user.uid);
                setRole(userRole);
            }
        };
        fetchRole();
    }, []); // Empty array is fine here as we want it on mount, but we should be careful if user changes.

    // Determine which button is active based on current path
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bottom-nav-container">
            <button
                className={`bottom-nav-btn ${isActive('/home') ? 'active' : ''}`}
                onClick={() => navigate('/home')}
            >
                <Home size={20} />
            </button>
            <button
                className={`bottom-nav-btn ${isActive('/project-board') ? 'active' : ''}`}
                onClick={() => navigate('/project-board')}
            >
                <Layers size={20} />
            </button>
            <button
                className={`bottom-nav-btn ${isActive('/Progress') ? 'active' : ''}`}
                onClick={() => navigate('/Progress')}
            >
                <Activity size={20} />
            </button>
            <button
                className={`bottom-nav-btn ${isActive('/Mytask') ? 'active' : ''}`}
                onClick={() => navigate('/Mytask')}
            >
                <Grid size={20} />
            </button>
            {role === 'Mentor' && (
                <button
                    className={`bottom-nav-btn ${isActive('/mentorDashboard') ? 'active' : ''}`}
                    onClick={() => navigate('/mentorDashboard')}
                >
                    <Presentation size={20} />
                </button>
            )}
        </nav>
    );
};

export default BottomNav;
