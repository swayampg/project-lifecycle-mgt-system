import React, { useState, useEffect } from 'react';
import './Mytask.css';
import { Calendar } from 'lucide-react'; // Kept Calendar for the list
import Header from './Header'; // 🔹 Using your new component
import BottomNav from './BottomNav'; // 🔹 Using your new component

import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getTasksByProjectAndUser, getProjectById } from './services/db_services';

const Mytask = () => {
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserName, setCurrentUserName] = useState('');
    const projectId = localStorage.getItem('selectedProjectId');

    useEffect(() => {
        const fetchUserDataAndTasks = async () => {
            setLoading(true);
            try {
                // 1. Get current user's full name
                const user = auth.currentUser;
                if (!user) {
                    setLoading(false);
                    return;
                }

                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userName = userDoc.data().fullName;
                    setCurrentUserName(userName);

                    // 2. Fetch tasks for this user in the selected project
                    if (projectId) {
                        const [projData, myTasks] = await Promise.all([
                            getProjectById(projectId),
                            getTasksByProjectAndUser(projectId, userName)
                        ]);
                        if (projData) setProject(projData);
                        setTasks(myTasks);
                    }
                }
            } catch (error) {
                console.error("Error fetching my tasks data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndTasks();
    }, [projectId]);

    return (
        <div className="dashboard-wrapper">
            <Header />

            <main className="task-main-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0">My Tasks</h2>
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
                    <div className="task-list-container">
                        {!projectId ? (
                            <div className="no-data-msg text-muted text-center py-4">
                                No project selected. Please select one from the Home page.
                            </div>
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="task-item-card">
                                    <h3 className="task-name">{task.name}</h3>
                                    <div className="task-meta-row">
                                        <div className="due-date-info">
                                            <Calendar size={14} />
                                            <span>Due : {task.deadline || 'No deadline'}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={`priority-badge priority-${task.priority?.toLowerCase()}`}>
                                                {task.priority || 'Medium'}
                                            </span>
                                            <span className={`badge-status ${task.status === 'Done'
                                                ? 'bg-green'
                                                : task.status === 'In Progress'
                                                    ? 'bg-orange'
                                                    : 'bg-secondary'
                                                }`}>
                                                {task.status || 'To Do'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data-msg text-muted text-center py-4">
                                No tasks assigned to you in this project.
                            </div>
                        )}

                        <div className="task-item-card empty-placeholder"></div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default Mytask;