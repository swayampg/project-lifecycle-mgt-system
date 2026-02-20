import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import './Home.css';
// 🔹 MAKE SURE TO INSTALL: npm install lucide-react (for icons)
import { Plus, Folder, CheckSquare } from 'lucide-react';
import BottomNav from './BottomNav';
import Header from './Header';

const Home = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsArray = [];
            querySnapshot.forEach((doc) => {
                projectsArray.push({ id: doc.id, ...doc.data() });
            });
            setProjects(projectsArray);
        });

        return () => unsubscribe();
    }, []);

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
                                <div className="h5 mb-0">{projects.length}</div>
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
                    {projects.length > 0 ? (
                        <div className="project-list w-100 p-4">
                            <h5 className="mb-4">Your Projects</h5>
                            <div className="row g-4">
                                {projects.map((project) => (
                                    <div key={project.id} className="col-md-6 col-lg-4">
                                        <div
                                            className="project-item-card p-3 shadow-sm border rounded-3 bg-white cursor-pointer"
                                            onClick={() => navigate('/ProjectBoard')}
                                        >
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="project-name mb-0 text-primary">{project.Name}</h6>
                                                <span className="badge bg-light text-dark small">{project.category}</span>
                                            </div>
                                            <div className="text-muted small mb-2">
                                                <strong>Leader:</strong> {project.projectLeader}
                                            </div>
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span><strong>Start:</strong> {project.startDate}</span>
                                                <span><strong>End:</strong> {project.endDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <h5>Your Projects Will Appear here</h5>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;