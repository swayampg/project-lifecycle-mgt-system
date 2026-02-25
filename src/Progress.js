import React, { useState, useEffect } from 'react';
// Lucide-react icons for consistency
import { } from 'lucide-react'; // Removing unused icons
import './Progress.css'; // Standardized naming for your CSS file
import BottomNav from './BottomNav';
import Header from './Header';

import { getProjectPhases, getTasksByPhase, getProjectById } from './services/db_services';

const Progress = () => {
    const [project, setProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const projectId = localStorage.getItem('selectedProjectId');

    useEffect(() => {
        const fetchProgressData = async () => {
            if (!projectId) {
                setLoading(false);
                return;
            }

            try {
                const [projData, phaseData] = await Promise.all([
                    getProjectById(projectId),
                    getProjectPhases(projectId)
                ]);

                if (projData) setProject(projData);

                // Fetch tasks for each phase to calculate real progress
                const enrichedPhases = await Promise.all(phaseData.map(async (p) => {
                    const tasks = await getTasksByPhase(p.id);
                    return {
                        id: p.id,
                        title: p.phaseName,
                        tasks: tasks || []
                    };
                }));

                setPhases(enrichedPhases);
            } catch (error) {
                console.error("Error fetching progress data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgressData();
    }, [projectId]);

    const calculateOverallProgress = () => {
        let totalTasks = 0;
        let completedTasks = 0;

        phases.forEach(phase => {
            totalTasks += phase.tasks.length;
            completedTasks += phase.tasks.filter(t => t.completed).length;
        });

        if (totalTasks === 0) return 0;
        return Math.round((completedTasks / totalTasks) * 100);
    };

    const overallProgress = calculateOverallProgress();

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0; // Requirement: 0% if no tasks
        const completedCount = tasks.filter(t => t.completed).length;
        return Math.round((completedCount / tasks.length) * 100);
    };

    return (
        <div className="plm-dashboard-container">
            <Header />

            {/* --- MAIN TIMELINE CONTENT --- */}
            <main className="plm-content-area">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="timeline-title mb-0">Project TimeLine</h2>
                    {project && (
                        <div className="project-context-badge">
                            <span className="text-muted small">Project: </span>
                            <span className="fw-bold text-primary">{project.Name}</span>
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="progress-content-wrapper">
                        <div className="progress-main-layout">
                            <div className="timeline-section">
                                <div className="timeline-list">
                                    {phases.length > 0 ? (
                                        phases.map((phase) => {
                                            const total = phase.tasks ? phase.tasks.length : 0;
                                            const completed = phase.tasks ? phase.tasks.filter(t => t.completed).length : 0;
                                            const progress = calculateProgress(phase.tasks);

                                            return (
                                                <div key={phase.id} className="timeline-card">
                                                    <div className="card-blue-accent"></div>
                                                    <div className="card-body-content">
                                                        <h3 className="card-project-title">{phase.title}</h3>
                                                        <p className="card-project-desc">Phase progress tracking</p>

                                                        <div className="card-stats-row">
                                                            <div className="progress-bar-container">
                                                                <div
                                                                    className="progress-bar-fill"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="stats-text">
                                                                <div>Total Tasks: {total}</div>
                                                                <div>Completed: {completed}</div>
                                                                <div className="progress-percentText">{progress}%</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-data-msg">
                                            {projectId ? "No phases found. Create them in the Project Board." : "No project selected. Please select a project from the Home page."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="progress-sidebar">
                                {phases.length > 0 && (
                                    <div className="sidebar-overview-content">
                                        <h4 className="sidebar-heading">OVERALL PROGRESS</h4>
                                        <div
                                            className="pie-chart-container"
                                            style={{
                                                background: `conic-gradient(#2ecc71 ${overallProgress}%, #e9ecef 0)`
                                            }}
                                        >
                                            <div className="pie-chart-center">
                                                <span>{overallProgress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </aside>
                        </div>
                    </div>
                )}
            </main >

            <BottomNav />
        </div >
    );
};

export default Progress;