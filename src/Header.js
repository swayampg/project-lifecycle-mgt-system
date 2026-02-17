import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import './Header.css';

const Header = () => {
    return (
        <header className="main-header d-flex justify-content-between align-items-center">
            {/* Profile Section */}
            <div className="header-profile-section d-flex align-items-center">
                <img
                    src="https://via.placeholder.com/150"
                    alt="Profile"
                    className="me-2"
                />
                <div>
                    <div className="fw-bold small">User</div>
                    <div className="small opacity-75" style={{ fontSize: '11px' }}>Member</div>
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
