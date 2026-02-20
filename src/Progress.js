import React, { useState, useEffect } from 'react';
// Lucide-react icons for the top and bottom navigation consistency
import { Search, Bell, Settings } from 'lucide-react';
import './Progress.css'; // Standardized naming for your CSS file
import BottomNav from './BottomNav';
import Header from './Header';

const Progress = () => {
    const [phases, setPhases] = useState([]);

    useEffect(() => {
        const savedPhases = localStorage.getItem('projectPhases');
        if (savedPhases) {
            setPhases(JSON.parse(savedPhases));
        }
    }, []);

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0;
        const completedCount = tasks.filter(t => t.completed).length;
        return Math.round((completedCount / tasks.length) * 100);
    };

    return (
        <div className="plm-dashboard-container">
            <Header />

            {/* --- MAIN TIMELINE CONTENT --- */}
            <main className="plm-content-area">
                <h2 className="timeline-title">Project TimeLine</h2>
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
                        <div className="no-data-msg">No phases found. Create them in the Project Board.</div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Progress;