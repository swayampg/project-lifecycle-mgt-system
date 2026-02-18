import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
// 🔹 MAKE SURE TO INSTALL: npm install lucide-react (for icons)
import { Plus, Folder, CheckSquare } from 'lucide-react';
import BottomNav from './BottomNav';
import Header from './Header';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <Header />

            <div className="container mt-4">
                {/* --- STAT CARDS SECTION --- */}
                <div className="row g-4">
                    {/* Create New Project Card */}
                    <div className="col-md-4">
                        <div
                            className="stat-card p-3 d-flex align-items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/CreateProject')}
                        >
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

            <BottomNav />
        </div>
    );
};

export default Home;