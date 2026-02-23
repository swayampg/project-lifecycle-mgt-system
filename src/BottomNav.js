import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Layers, Activity, Grid } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

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
        </nav>
    );
};

export default BottomNav;
