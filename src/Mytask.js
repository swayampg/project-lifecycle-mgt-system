import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mytask.css';
import { Calendar } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getAllTasksByUser } from './services/db_services';

const Mytask = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserName, setCurrentUserName] = useState('');
    const [projectNames, setProjectNames] = useState({});

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

                    // 2. Fetch ALL tasks assigned to this user globally
                    const allTasks = await getAllTasksByUser(userName);
                    setTasks(allTasks);

                    // 3. Fetch project names for each task's phase
                    const uniquePhaseIds = [...new Set(allTasks.map(t => t.phaseId).filter(id => id))];
                    const namesMap = {};

                    for (const phaseId of uniquePhaseIds) {
                        try {
                            const phaseDoc = await getDoc(doc(db, "project-phases", phaseId));
                            if (phaseDoc.exists()) {
                                namesMap[phaseId] = phaseDoc.data().projectName || "Unknown Project";
                            }
                        } catch (err) {
                            console.error(`Error fetching project name for phase ${phaseId}:`, err);
                        }
                    }
                    setProjectNames(namesMap);
                }
            } catch (error) {
                console.error("Error fetching my tasks data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserDataAndTasks();
    }, []);

    const handleTaskClick = async (task) => {
        if (task.id && task.phaseId) {
            localStorage.setItem('autoOpenTaskId', task.id);
            localStorage.setItem('autoOpenPhaseId', task.phaseId);

            // Set the correct project ID so the board loads correctly
            try {
                const phaseDoc = await getDoc(doc(db, "project-phases", task.phaseId));
                if (phaseDoc.exists()) {
                    localStorage.setItem('selectedProjectId', phaseDoc.data().proj_id);
                }
            } catch (error) {
                console.error("Error fetching project context:", error);
            }

            navigate('/project-board');
        }
    };

    return (
        <div className="dashboard-wrapper">
            <Header />

            <main className="task-main-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="section-title mb-0">My Tasks</h2>
                    <div className="tasks-count-badge badge bg-primary rounded-pill px-3 py-2">
                        {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Total
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="task-list-container">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="task-item-card mb-3 p-3 shadow-sm border rounded-3"
                                    onClick={() => handleTaskClick(task)}
                                    style={{ cursor: 'pointer', background: '#fff' }}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <h3 className="task-name mb-0" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{task.name}</h3>
                                        <span className="project-context-label fw-bold text-primary small bg-light px-2 py-1 rounded">
                                            {projectNames[task.phaseId] || '...'}
                                        </span>
                                    </div>
                                    <div className="task-meta-row d-flex align-items-center gap-3 mt-2 text-muted small">
                                        <div className="due-date-info d-flex align-items-center gap-1">
                                            <Calendar size={14} />
                                            <span>Due: {task.deadline || 'No deadline'}</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 ms-auto">
                                            <span className={`priority-badge priority-${task.priority?.toLowerCase()} badge`}>
                                                {task.priority || 'Medium'}
                                            </span>
                                            <span className={`badge-status badge ${task.status === 'Done'
                                                ? 'bg-success'
                                                : task.status === 'In Progress'
                                                    ? 'bg-warning text-dark'
                                                    : 'bg-secondary'
                                                }`}>
                                                {task.status || 'To Do'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data-msg text-muted text-center py-5 border rounded-3 bg-light">
                                <p className="mb-0">No tasks assigned to you across any projects.</p>
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