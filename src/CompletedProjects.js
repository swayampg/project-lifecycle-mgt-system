import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { getAllCompletedProjects } from './services/db_services';
import './CompletedProjects.css';
import { Award, Calendar, Folder, UserCheck, ArrowLeft } from 'lucide-react';

const CompletedProjects = () => {
    const navigate = useNavigate();
    const [completedProjects, setCompletedProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompleted = async () => {
            setLoading(true);
            try {
                const projects = await getAllCompletedProjects();
                // Sort by end date descending (newest completed first)
                const sortedProjects = projects.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
                setCompletedProjects(sortedProjects);
            } catch (error) {
                console.error("Error fetching completed projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompleted();
    }, []);

    return (
        <div className="completed-projects-container">
            <Header />

            <div className="completed-projects-header">
                <h1>Completed Projects Archive</h1>
                <p>Celebrating the milestones and achievements of our project lifecycle management system.</p>
                <button
                    className="btn btn-outline-light mt-4 d-inline-flex align-items-center gap-2"
                    onClick={() => navigate('/home')}
                    style={{ borderRadius: '20px', padding: '10px 20px' }}
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
            </div>

            <main className="container-fluid px-lg-5">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : completedProjects.length > 0 ? (
                    <div className="projects-grid">
                        {completedProjects.map((project) => (
                            <div key={project.id} className="completed-project-card">
                                <div className="card-top">
                                    <span className="category-tag d-flex align-items-center gap-1">
                                        <Folder size={12} /> {project.category || 'General'}
                                    </span>
                                    <Award className="text-success" size={24} />
                                </div>
                                <h3 className="project-title">{project.Name}</h3>
                                <p className="project-desc">{project.description || 'No description provided.'}</p>

                                <div className="card-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Project Leader</span>
                                        <span className="stat-value d-flex align-items-center gap-1">
                                            <UserCheck size={14} /> {project.projectLeader}
                                        </span>
                                    </div>
                                    <div className="stat-item ms-auto">
                                        <span className="stat-label">Completed On</span>
                                        <span className="stat-value d-flex align-items-center gap-1">
                                            <Calendar size={14} /> {project.endDate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Award size={60} className="mb-3 opacity-25" />
                        <h3>No Completed Projects Yet</h3>
                        <p>Keep working hard and soon you'll see your accomplishments here!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CompletedProjects;
