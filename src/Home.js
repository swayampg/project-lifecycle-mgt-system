import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
    getUserProjects,
    getInvitationsForUser,
    respondToInvitation
} from './services/db_services';
import './Home.css';
import { Plus, Folder, CheckSquare, Bell, Check, X } from 'lucide-react';
import BottomNav from './BottomNav';
import Header from './Header';

const Home = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchData = async (user) => {
        if (!user) return;
        setLoading(true);
        try {
            const [projs, invites] = await Promise.all([
                getUserProjects(user.uid),
                getInvitationsForUser(user.uid)
            ]);
            setProjects(projs);
            setInvitations(invites);
        } catch (error) {
            console.error("Error fetching home data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                fetchData(user);
            } else {
                navigate('/Login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleInviteResponse = async (invite, accept) => {
        try {
            await respondToInvitation(invite, accept);
            // Refresh data
            fetchData(currentUser);
            if (accept) {
                alert(`Joined ${invite.projectName}!`);
            }
        } catch (error) {
            console.error("Error responding to invitation:", error);
        }
    };

    return (
        <div className="dashboard-container">
            <Header />

            <div className="container mt-4">
                {/* --- INVITATIONS SECTION --- */}
                {invitations.length > 0 && (
                    <div className="invitations-section mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <Bell className="text-primary" size={20} />
                            <h5 className="m-0">Pending Invitations</h5>
                        </div>
                        <div className="row g-3">
                            {invitations.map((invite) => (
                                <div key={invite.id} className="col-md-6 col-lg-4">
                                    <div className="invite-card p-3 border rounded shadow-sm bg-white d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="fw-bold text-primary">{invite.projectName}</div>
                                            <div className="small text-muted">
                                                By {invite.senderName} as <strong>{invite.role}</strong>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-success rounded-circle p-1"
                                                onClick={() => handleInviteResponse(invite, true)}
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger rounded-circle p-1"
                                                onClick={() => handleInviteResponse(invite, false)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STAT CARDS SECTION --- */}
                <div className="row g-4">
                    <div className="col-md-4">
                        <div
                            className="stat-card p-3 d-flex align-items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/CreateProject')}
                        >
                            <div className="icon-box bg-primary">
                                <Plus color="white" />
                            </div>
                            <span className="fw-bold">Create New Project</span>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-dark">
                                <Folder color="white" />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Total Projects</div>
                                <div className="h5 mb-0">{projects.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-primary">
                                <CheckSquare color="white" />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Your Tasks</div>
                                <div className="h5 mb-0">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN DISPLAY AREA --- */}
                <div className="project-area mt-4">
                    <h5 className="mb-4">Your Projects</h5>
                    {loading ? (
                        <div className="text-center p-5 text-muted">Loading projects...</div>
                    ) : projects.length > 0 ? (
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
                    ) : (
                        <div className="text-center p-5 border rounded bg-white text-muted">
                            <Folder size={40} className="mb-3 opacity-25" />
                            <p className="mb-0">No projects yet. Create one or wait for an invitation!</p>
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;