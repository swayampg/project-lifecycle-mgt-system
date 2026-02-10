import React from 'react';
import './Home.css';
// 🔹 MAKE SURE TO INSTALL: npm install lucide-react (for icons)
import { Search, Bell, Settings, Plus, Folder, CheckSquare, Home as HomeIcon, Layers, Activity, Grid } from 'lucide-react';

const Home = () => {

    return (
        <div className="dashboard-container">
            {/* --- TOP NAVIGATION BAR --- */}
            <header className="top-nav d-flex justify-content-between align-items-center">
                <div className="profile-section d-flex align-items-center">
                    <img src="https://via.placeholder.com/150" alt="Profile" className="me-2" />
                    <div>
                        <div className="fw-bold small">Swayam Pagui</div>
                        <div className="small opacity-75">Member</div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0"><Search size={18} /></span>
                        <input type="text" className="form-control border-start-0" placeholder="Search" />
                    </div>
                    <Bell className="cursor-pointer" />
                    <Settings className="cursor-pointer" />
                </div>
            </header>

            <div className="container mt-4">
                {/* --- STAT CARDS SECTION --- */}
                <div className="row g-4">
                    {/* Create New Project Card */}
                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3 cursor-pointer">
                            <div className="icon-box bg-primary">
                                <Plus />
                            </div>
                            <span className="fw-bold">Create New Project</span>
                        </div>
                    </div>

                    {/* Total Projects Card */}
                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-dark">
                                <Folder />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Total Projects</div>
                                <div className="h5 mb-0">0</div>
                            </div>
                        </div>
                    </div>

                    {/* Your Task Card */}
                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-primary">
                                <CheckSquare />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Your Task</div>
                                <div className="h5 mb-0">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN DISPLAY AREA --- */}
                <div className="project-area mt-4">
                    <h5>Your Projects Will Appear here</h5>
                </div>
            </div>

            {/* --- BOTTOM FLOATING NAVIGATION --- */}
            <nav className="bottom-nav">
                {/* 🔹 ADD navigate('/home') to these buttons later */}
                <button className="nav-item active"><HomeIcon size={20} /></button>
                <button className="nav-item"><Layers size={20} /></button>
                <button className="nav-item"><Activity size={20} /></button>
                <button className="nav-item"><Grid size={20} /></button>
            </nav>
        </div>
    );
};

export default Home;