import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { getAllCompletedProjects } from './services/db_services';
import './CompletedProjects.css';
import { Award, Calendar, Folder, UserCheck, ArrowLeft, FileText, Github, X, Layers, Briefcase, Info } from 'lucide-react';

const CompletedProjects = () => {
    const navigate = useNavigate();
    const [completedProjects, setCompletedProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchCompleted = async () => {
            setLoading(true);
            try {
                const projects = await getAllCompletedProjects();
                // Sort by completion date descending (newest completed first)
                const sortedProjects = projects.sort((a, b) => {
                    const dateA = new Date(a.completedDate || a.endDate);
                    const dateB = new Date(b.completedDate || b.endDate);
                    return dateB - dateA;
                });
                setCompletedProjects(sortedProjects);
            } catch (error) {
                console.error("Error fetching completed projects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompleted();
    }, []);

    const openProjectDetails = (project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const closeProjectDetails = () => {
        setIsModalOpen(false);
        setSelectedProject(null);
    };

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
                            <div key={project.id} className="completed-project-card cursor-pointer" onClick={() => openProjectDetails(project)}>
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
                                            <Calendar size={14} /> {project.completedDate || project.endDate}
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

            {/* Project Details Modal */}
            {isModalOpen && selectedProject && (
                <div className="modal-overlay" onClick={closeProjectDetails}>
                    <div className="modal-content-custom details-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-custom d-flex justify-content-between border-bottom pb-3">
                            <h5 className="m-0 fw-bold text-primary d-flex align-items-center gap-2">
                                <Info size={20} /> Project Archive Details
                            </h5>
                            <button className="btn-close-custom bg-transparent border-0" onClick={closeProjectDetails}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body-custom py-4 scroller-detail">
                            <div className="detail-section mb-4">
                                <label className="form-label mb-0 d-flex align-items-center gap-2 text-muted small">
                                    <Layers size={14} /> Project Title
                                </label>
                                <h4 className="text-secondary fw-bold mt-1">{selectedProject.Name}</h4>
                            </div>
                            <div className="detail-section mb-4">
                                <label className="form-label d-flex align-items-center gap-2 text-muted small">Description</label>
                                <p className="text-dark bg-light p-3 rounded">{selectedProject.description || 'No description provided.'}</p>
                            </div>
                            <div className="row mb-4">
                                <div className="col-6">
                                    <label className="form-label d-flex align-items-center gap-2 text-muted small">
                                        <Layers size={14} /> Category
                                    </label>
                                    <div className="fw-bold text-dark">{selectedProject.category || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <label className="form-label d-flex align-items-center gap-2 text-muted small">
                                        <Briefcase size={14} /> Department
                                    </label>
                                    <div className="fw-bold text-dark">{selectedProject.department || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-6">
                                    <label className="form-label d-flex align-items-center gap-2 text-muted small">
                                        <UserCheck size={14} /> Project Leader
                                    </label>
                                    <div className="text-primary fw-bold">{selectedProject.projectLeader || 'N/A'}</div>
                                </div>
                                <div className="col-6">
                                    <label className="form-label d-flex align-items-center gap-2 text-muted small">
                                        <Calendar size={14} /> Completion Date
                                    </label>
                                    <div className="fw-bold text-dark">{selectedProject.completedDate || selectedProject.endDate || 'N/A'}</div>
                                </div>
                            </div>
                            
                            <hr className="my-4 text-muted" />
                            <h6 className="fw-bold text-secondary mb-3">Resources & Links</h6>
                            <div className="d-flex flex-column gap-3">
                                {selectedProject.projectReport ? (
                                    <div className="p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2 text-dark">
                                            <FileText size={18} className="text-primary" />
                                            <span className="fw-medium">Project Report (PDF)</span>
                                        </div>
                                        <a href={selectedProject.projectReport} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                            View Report
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-3 border rounded bg-light text-muted d-flex align-items-center gap-2">
                                        <FileText size={18} /> No project report available
                                    </div>
                                )}
                                
                                {selectedProject.githubRepo ? (
                                    <div className="p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center gap-2 text-dark">
                                            <Github size={18} />
                                            <span className="fw-medium">GitHub Repository</span>
                                        </div>
                                        <a href={selectedProject.githubRepo.startsWith('http') ? selectedProject.githubRepo : `//${selectedProject.githubRepo}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark">
                                            Open Repo
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-3 border rounded bg-light text-muted d-flex align-items-center gap-2">
                                        <Github size={18} /> No GitHub repository linked
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer-custom border-top pt-3 text-end">
                            <button className="btn btn-secondary w-100" onClick={closeProjectDetails}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompletedProjects;
