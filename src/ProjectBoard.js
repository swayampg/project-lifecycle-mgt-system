import React, { useState, useEffect } from 'react';
import './ProjectBoard.css';
import { Plus, Minus, X, Edit2, Check, Layout } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
    getProjectPhases,
    addProjectPhase,
    updateProjectPhase,
    deleteProjectPhase,
    getProjectById,
    getProjectTeamMembers,
    addProjectTask,
    getTasksByPhase,
    updateProjectTask,
    deleteProjectTask
} from './services/db_services';
import BottomNav from './BottomNav';
import Header from './Header';

const ProjectBoard = () => {
    const projectId = localStorage.getItem('selectedProjectId');
    const [project, setProject] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(!!projectId);
    const [currentUserName, setCurrentUserName] = useState('');
    const [userRole, setUserRole] = useState(null);

    // 2. STATE FOR MODALS AND EDITING
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
    const [currentPhaseId, setCurrentPhaseId] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);

    // Rename state
    const [editingPhaseId, setEditingPhaseId] = useState(null);
    const [editPhaseTitle, setEditPhaseTitle] = useState('');

    // Form state for adding task
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newAssignBy, setNewAssignBy] = useState('');
    const [newAssignTo, setNewAssignTo] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [newMedia, setNewMedia] = useState({ photos: [], videos: [] });

    useEffect(() => {
        if (projectId) {
            fetchProjectTeamAndPhases(projectId);
        } else {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setCurrentUserName(userDoc.data().fullName);
                }
            }
        };
        fetchUserData();
    }, []);

    const fetchProjectTeamAndPhases = async (id) => {
        setLoading(true);
        try {
            const [projData, phaseData, teamData] = await Promise.all([
                getProjectById(id),
                getProjectPhases(id),
                getProjectTeamMembers(id)
            ]);

            if (projData) setProject(projData);
            if (teamData) {
                setTeamMembers(teamData);
                // Find current user's role
                const user = auth.currentUser;
                const myMember = teamData.find(m => m.uid === user?.uid);
                if (myMember) setUserRole(myMember.role);
            }

            // Fetch tasks for each phase
            const phasesWithTasks = await Promise.all(phaseData.map(async (p) => {
                const tasks = await getTasksByPhase(p.id);
                return {
                    id: p.id,
                    title: p.phaseName,
                    tasks: tasks || []
                };
            }));

            setPhases(phasesWithTasks);
        } catch (error) {
            console.error("Error fetching project data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0;
        const completedCount = tasks.filter(t => t.completed).length;
        return Math.round((completedCount / tasks.length) * 100);
    };

    // --- HELPERS ---
    const isLeader = userRole === 'Leader' || userRole === 'Project Leader';

    // --- PHASE ACTIONS ---

    const handleAddPhase = async () => {
        try {
            const newPhase = await addProjectPhase(projectId, 'New Phase', project?.Name || "");
            setPhases(prev => [...prev, {
                id: newPhase.id,
                title: newPhase.phaseName,
                tasks: []
            }]);
        } catch (error) {
            console.error("Error adding phase:", error);
            alert("Failed to add phase. Please try again.");
        }
    };

    const handleRemovePhase = async (phaseId) => {
        if (window.confirm("Are you sure you want to remove this phase?")) {
            try {
                await deleteProjectPhase(phaseId);
                setPhases(prev => prev.filter(p => p.id !== phaseId));
            } catch (error) {
                console.error("Error removing phase:", error);
                alert("Failed to remove phase.");
            }
        }
    };

    const startEditing = (phaseId, currentTitle) => {
        setEditingPhaseId(phaseId);
        setEditPhaseTitle(currentTitle);
    };

    const saveRename = async (phaseId) => {
        if (!editPhaseTitle.trim()) return;
        try {
            await updateProjectPhase(phaseId, { phaseName: editPhaseTitle });
            setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, title: editPhaseTitle } : p));
            setEditingPhaseId(null);
        } catch (error) {
            console.error("Error renaming phase:", error);
            alert("Failed to rename phase.");
        }
    };

    const cancelEditing = () => {
        setEditingPhaseId(null);
        setEditPhaseTitle('');
    };

    const handleResetBoard = () => {
        if (window.confirm("Are you sure you want to reset the board? This will clear all phases.")) {
            setPhases([]);
        }
    };

    // --- TASK ACTIONS ---

    const openAddTaskModal = (phaseId) => {
        setCurrentPhaseId(phaseId);
        setNewTaskName('');
        setNewTaskDescription('');
        setNewAssignBy(currentUserName); // Auto-set
        setNewAssignTo('');
        setNewDeadline('');
        setNewStatus('In Progress');
        setNewPriority('Medium');
        setNewMedia({ photos: [], videos: [] });
        setIsAddTaskModalOpen(true);
    };

    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewMedia(prev => ({
                    ...prev,
                    [type]: [...prev[type], reader.result]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index, type) => {
        setNewMedia(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;

        const taskData = {
            name: newTaskName,
            description: newTaskDescription,
            assignBy: newAssignBy,
            assignTo: newAssignTo,
            deadline: newDeadline,
            status: newStatus,
            priority: newPriority,
            media: newMedia,
            phaseId: currentPhaseId,
            completed: false
        };

        try {
            const taskId = await addProjectTask(taskData);
            const newTask = { id: taskId, ...taskData };

            setPhases(prev => prev.map(p => {
                if (p.id === currentPhaseId) {
                    return { ...p, tasks: [...p.tasks, newTask] };
                }
                return p;
            }));

            setIsAddTaskModalOpen(false);
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task.");
        }
    };

    const toggleTaskCompletion = async (e, phaseId, taskId) => {
        e.stopPropagation();
        const currentPhase = phases.find(p => p.id === phaseId);
        const task = currentPhase.tasks.find(t => t.id === taskId);
        const newCompleted = !task.completed;

        try {
            await updateProjectTask(taskId, { completed: newCompleted });
            setPhases(prev => prev.map(p => {
                if (p.id === phaseId) {
                    return {
                        ...p,
                        tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t)
                    };
                }
                return p;
            }));
        } catch (error) {
            console.error("Error toggling task completion:", error);
        }
    };

    const viewTaskDetails = (task, phaseId) => {
        setCurrentTask(task);
        setCurrentPhaseId(phaseId);
        setNewTaskName(task.name);
        setNewTaskDescription(task.description);
        setNewAssignBy(task.assignBy || '');
        setNewAssignTo(task.assignTo || '');
        setNewDeadline(task.deadline || '');
        setNewStatus(task.status || '');
        setNewPriority(task.priority || '');
        setNewMedia(task.media || { photos: [], videos: [] });
        setIsViewTaskModalOpen(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();
        const updates = {
            name: newTaskName,
            description: newTaskDescription,
            assignBy: newAssignBy,
            assignTo: newAssignTo,
            deadline: newDeadline,
            status: newStatus,
            priority: newPriority,
            media: newMedia
        };

        try {
            await updateProjectTask(currentTask.id, updates);
            setPhases(prev => prev.map(p => {
                if (p.id === currentPhaseId) {
                    return {
                        ...p,
                        tasks: p.tasks.map(t => t.id === currentTask.id ? { ...t, ...updates } : t)
                    };
                }
                return p;
            }));
            setIsViewTaskModalOpen(false);
        } catch (error) {
            console.error("Error updating task:", error);
            alert("Failed to update task.");
        }
    };

    const handleDeleteTask = async () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteProjectTask(currentTask.id);
                setPhases(prev => prev.map(p => {
                    if (p.id === currentPhaseId) {
                        return {
                            ...p,
                            tasks: p.tasks.filter(t => t.id !== currentTask.id)
                        };
                    }
                    return p;
                }));
                setIsViewTaskModalOpen(false);
            } catch (error) {
                console.error("Error deleting task:", error);
                alert("Failed to delete task.");
            }
        }
    };

    return (
        <div className="project-board-container">
            <Header />

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading phases...</span>
                    </div>
                </div>
            ) : !projectId ? (
                <div className="no-phases-container d-flex flex-column align-items-center justify-content-center" style={{ height: '70vh' }}>
                    <Layout size={80} className="text-muted mb-4 opacity-25" />
                    <h3 className="text-muted">No project selected</h3>
                    <p className="text-muted">Select a project from the home page to view its board.</p>
                </div>
            ) : (
                /* --- BOARD AREA --- */
                <>
                    <div className="board-header mb-4 d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="m-0 text-primary">{project?.Name || "Project Board"}</h2>
                            {project?.category && <span className="badge bg-light text-muted border">{project.category}</span>}
                        </div>
                    </div>

                    <div className="board-wrapper shadow-sm">
                        {phases.length === 0 ? (
                            <div className="no-phases-inner d-flex flex-column align-items-center justify-content-center py-5">
                                <h4 className="text-muted">No phases found</h4>
                                <p className="text-muted">Start by adding your first project phase below.</p>
                            </div>
                        ) : (
                            <div className="board-columns">
                                {phases.map((phase) => (
                                    <div key={phase.id} className="board-column">
                                        <div className="column-header">
                                            {editingPhaseId === phase.id ? (
                                                <div className="edit-phase-input-group">
                                                    <input
                                                        type="text"
                                                        className="edit-phase-input"
                                                        value={editPhaseTitle}
                                                        onChange={(e) => setEditPhaseTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveRename(phase.id);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                        autoFocus
                                                    />
                                                    <Check
                                                        size={14}
                                                        className="cursor-pointer"
                                                        onClick={() => saveRename(phase.id)}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <h6>{phase.title}</h6>
                                                    <div className="header-actions">
                                                        {isLeader && (
                                                            <>
                                                                <Edit2
                                                                    size={14}
                                                                    className="cursor-pointer"
                                                                    onClick={() => startEditing(phase.id, phase.title)}
                                                                />
                                                                <Minus
                                                                    size={14}
                                                                    className="cursor-pointer"
                                                                    onClick={() => handleRemovePhase(phase.id)}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="column-body">
                                            {isLeader && (
                                                <button
                                                    className="add-task-btn"
                                                    onClick={() => openAddTaskModal(phase.id)}
                                                >
                                                    <Plus size={14} /> Add task
                                                </button>
                                            )}
                                            {phase.tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className={`task-item ${task.completed ? 'completed' : ''}`}
                                                    onClick={() => viewTaskDetails(task, phase.id)}
                                                >
                                                    <span>{task.name}</span>
                                                    <div
                                                        className="status-circle"
                                                        onClick={(e) => toggleTaskCompletion(e, phase.id, task.id)}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Phase Button (FAB) */}
                        <div className="add-phase-container">
                            {isLeader && (
                                <>
                                    <button className="btn-reset-board" onClick={handleResetBoard}>
                                        Reset Board
                                    </button>
                                    <button className="btn-add-phase" onClick={handleAddPhase}>
                                        <Plus size={18} /> Add Phase
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            <BottomNav />

            {/* --- MODALS --- */}

            {/* Add Task Modal */}
            {isAddTaskModalOpen && (
                <div className="modal-overlay">
                    <div className="add-task-modal-content">
                        <div className="add-task-modal-header">
                            <span>Add new task</span>
                        </div>
                        <form onSubmit={handleAddTask} className="add-task-form">
                            <div className="add-task-modal-body">
                                <div className="form-left-column">
                                    <div className="form-field">
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Description</label>
                                        <textarea
                                            value={newTaskDescription}
                                            onChange={(e) => setNewTaskDescription(e.target.value)}
                                            rows="6"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="form-right-column">
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Assign by</label>
                                            <input
                                                type="text"
                                                value={newAssignBy}
                                                readOnly
                                                className="bg-light"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Assign to</label>
                                            <select
                                                value={newAssignTo}
                                                onChange={(e) => setNewAssignTo(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Member</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.uid} value={member.fullName}>
                                                        {member.fullName} ({member.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Deadline</label>
                                            <div className="date-input-wrapper">
                                                <input
                                                    type="date"
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <label>Status</label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                            >
                                                <option value=""></option>
                                                <option value="To Do">To Do</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Done">Done</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-field priority-field">
                                        <label>Priority <span className="required-star">*</span></label>
                                        <select
                                            value={newPriority}
                                            onChange={(e) => setNewPriority(e.target.value)}
                                            required
                                        >
                                            <option value=""></option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="add-task-modal-footer">
                                <button type="submit" className="create-task-btn">
                                    Create task
                                </button>
                            </div>
                        </form>
                        <div
                            className="modal-close-icon"
                            onClick={() => setIsAddTaskModalOpen(false)}
                        >
                            <X size={20} />
                        </div>
                    </div>
                </div>
            )}

            {/* View/Edit Task Modal */}
            {isViewTaskModalOpen && currentTask && (
                <div className="modal-overlay">
                    <div className="add-task-modal-content">
                        <div className="add-task-modal-header">
                            <span>Edit task</span>
                        </div>
                        <form onSubmit={handleSaveTask} className="add-task-form">
                            <div className="add-task-modal-body">
                                <div className="form-left-column">
                                    <div className="form-field">
                                        <label>Title <span className="required-star">*</span></label>
                                        <input
                                            type="text"
                                            value={newTaskName}
                                            onChange={(e) => setNewTaskName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Description</label>
                                        <textarea
                                            value={newTaskDescription}
                                            onChange={(e) => setNewTaskDescription(e.target.value)}
                                            rows="6"
                                        ></textarea>
                                    </div>

                                    <div className="media-upload-section mt-3">
                                        <label className="fw-bold d-block mb-2">Attachments</label>
                                        <div className="d-flex gap-2 mb-2">
                                            <label className="btn btn-outline-primary btn-sm mb-0">
                                                Add Image
                                                <input type="file" hidden accept="image/*" multiple onChange={(e) => handleFileChange(e, 'photos')} />
                                            </label>
                                            <label className="btn btn-outline-info btn-sm mb-0">
                                                Add Video
                                                <input type="file" hidden accept="video/*" multiple onChange={(e) => handleFileChange(e, 'videos')} />
                                            </label>
                                        </div>
                                        <div className="media-previews d-flex flex-wrap gap-2">
                                            {newMedia.photos.map((src, i) => (
                                                <div key={i} className="media-thumb">
                                                    <img src={src} alt="thumb" />
                                                    <div className="remove-media-overlay" onClick={() => removeMedia(i, 'photos')}>
                                                        <X size={12} />
                                                    </div>
                                                </div>
                                            ))}
                                            {newMedia.videos.map((src, i) => (
                                                <div key={i} className="media-thumb">
                                                    <video src={src} />
                                                    <div className="remove-media-overlay" onClick={() => removeMedia(i, 'videos')}>
                                                        <X size={12} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-right-column">
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Status <span className="required-star">*</span></label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                required
                                            >
                                                <option value=""></option>
                                                <option value="To Do">To Do</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Done">Done</option>
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>Priority <span className="required-star">*</span></label>
                                            <select
                                                value={newPriority}
                                                onChange={(e) => setNewPriority(e.target.value)}
                                                required
                                            >
                                                <option value=""></option>
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-field">
                                            <label>Assign by</label>
                                            <input
                                                type="text"
                                                value={newAssignBy}
                                                readOnly
                                                className="bg-light"
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Assign to</label>
                                            <select
                                                value={newAssignTo}
                                                onChange={(e) => setNewAssignTo(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Member</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.uid} value={member.fullName}>
                                                        {member.fullName} ({member.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Deadline</label>
                                        <input
                                            type="date"
                                            value={newDeadline}
                                            onChange={(e) => setNewDeadline(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="add-task-modal-footer">
                                <button type="button" className="delete-task-btn" onClick={handleDeleteTask}>
                                    Delete Task
                                </button>
                                <button type="submit" className="create-task-btn">
                                    Save changes
                                </button>
                            </div>
                        </form>
                        <div className="modal-close-icon" onClick={() => setIsViewTaskModalOpen(false)}>
                            <X size={20} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectBoard;
