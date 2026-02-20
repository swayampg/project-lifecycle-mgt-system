import React, { useState, useEffect } from 'react';
import './ProjectBoard.css';
import { Plus, Minus, X, Edit2, Check } from 'lucide-react';
import BottomNav from './BottomNav';
import Header from './Header';

const ProjectBoard = () => {
    // 1. STATE FOR PHASES AND TASKS
    const [phases, setPhases] = useState(() => {
        const saved = localStorage.getItem('projectPhases');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {
                console.error("Error parsing saved phases:", e);
            }
        }
        return [
            { id: 1, title: 'Requirement Analysis', tasks: [] },
            { id: 2, title: 'Design', tasks: [] },
            { id: 3, title: 'Implementation', tasks: [] },
            { id: 4, title: 'Testing', tasks: [] },
            { id: 5, title: 'Completions', tasks: [] }
        ];
    });

    useEffect(() => {
        localStorage.setItem('projectPhases', JSON.stringify(phases));
    }, [phases]);

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0;
        const completedCount = tasks.filter(t => t.completed).length;
        return Math.round((completedCount / tasks.length) * 100);
    };

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

    // --- PHASE ACTIONS ---

    const handleAddPhase = () => {
        const newPhase = {
            id: Date.now(),
            title: 'New Phase',
            tasks: []
        };
        setPhases(prev => [...prev, newPhase]);
    };

    const handleRemovePhase = (phaseId) => {
        if (window.confirm("Are you sure you want to remove this phase?")) {
            setPhases(prev => prev.filter(p => p.id !== phaseId));
        }
    };

    const startEditing = (phaseId, currentTitle) => {
        setEditingPhaseId(phaseId);
        setEditPhaseTitle(currentTitle);
    };

    const saveRename = (phaseId) => {
        if (!editPhaseTitle.trim()) return;
        setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, title: editPhaseTitle } : p));
        setEditingPhaseId(null);
    };

    const cancelEditing = () => {
        setEditingPhaseId(null);
        setEditPhaseTitle('');
    };

    const handleResetBoard = () => {
        if (window.confirm("Are you sure you want to reset the board to default phases? All current tasks will be lost.")) {
            const defaults = [
                { id: 1, title: 'Requirement Analysis', tasks: [] },
                { id: 2, title: 'Design', tasks: [] },
                { id: 3, title: 'Implementation', tasks: [] },
                { id: 4, title: 'Testing', tasks: [] },
                { id: 5, title: 'Completions', tasks: [] }
            ];
            setPhases(defaults);
            localStorage.setItem('projectPhases', JSON.stringify(defaults));
        }
    };

    // --- TASK ACTIONS ---

    const openAddTaskModal = (phaseId) => {
        setCurrentPhaseId(phaseId);
        setNewTaskName('');
        setNewTaskDescription('');
        setNewAssignBy('');
        setNewAssignTo('');
        setNewDeadline('');
        setNewStatus('');
        setNewPriority('');
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

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;

        const newTask = {
            id: `t-${Date.now()}`,
            name: newTaskName,
            description: newTaskDescription,
            assignBy: newAssignBy,
            assignTo: newAssignTo,
            deadline: newDeadline,
            status: newStatus,
            priority: newPriority,
            media: newMedia,
            completed: false
        };

        setPhases(prev => prev.map(p => {
            if (p.id === currentPhaseId) {
                return { ...p, tasks: [...p.tasks, newTask] };
            }
            return p;
        }));

        setIsAddTaskModalOpen(false);
    };

    const toggleTaskCompletion = (e, phaseId, taskId) => {
        e.stopPropagation(); // Prevent opening description popup
        setPhases(prev => prev.map(p => {
            if (p.id === phaseId) {
                return {
                    ...p,
                    tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
                };
            }
            return p;
        }));
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

    const handleSaveTask = (e) => {
        e.preventDefault();
        setPhases(prev => prev.map(p => {
            if (p.id === currentPhaseId) {
                return {
                    ...p,
                    tasks: p.tasks.map(t => t.id === currentTask.id ? {
                        ...t,
                        name: newTaskName,
                        description: newTaskDescription,
                        assignBy: newAssignBy,
                        assignTo: newAssignTo,
                        deadline: newDeadline,
                        status: newStatus,
                        priority: newPriority,
                        media: newMedia
                    } : t)
                };
            }
            return p;
        }));
        setIsViewTaskModalOpen(false);
    };

    const handleDeleteTask = () => {
        if (window.confirm("Are you sure you want to delete this task?")) {
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
        }
    };

    return (
        <div className="project-board-container">
            <Header />

            {/* --- BOARD AREA --- */}
            <div className="board-wrapper shadow-sm">
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
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="column-body">
                                <button
                                    className="add-task-btn"
                                    onClick={() => openAddTaskModal(phase.id)}
                                >
                                    <Plus size={14} /> Add task
                                </button>
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

                {/* Add Phase Button */}
                <div className="add-phase-container">
                    <button className="btn-reset-board me-3" onClick={handleResetBoard}>
                        Reset Board
                    </button>
                    <button className="btn-add-phase" onClick={handleAddPhase}>
                        Add Phase
                    </button>
                </div>
            </div>

            <BottomNav />

            {/* --- MODALS --- */}

            {/* Add Task Modal */}
            {isAddTaskModalOpen && (
                <div className="modal-overlay">
                    <div className="add-task-modal-content">
                        <div className="add-task-modal-header">
                            <span>Sample task</span>
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
                                                onChange={(e) => setNewAssignBy(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Assign to</label>
                                            <select
                                                value={newAssignTo}
                                                onChange={(e) => setNewAssignTo(e.target.value)}
                                            >
                                                <option value=""></option>
                                                <option value="User 1">User 1</option>
                                                <option value="User 2">User 2</option>
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
                        {/* Close button - though not in the image, usually needed. I'll add a small 'X' or click outside */}
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
                                                onChange={(e) => setNewAssignBy(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Assign to</label>
                                            <select
                                                value={newAssignTo}
                                                onChange={(e) => setNewAssignTo(e.target.value)}
                                            >
                                                <option value=""></option>
                                                <option value="User 1">User 1</option>
                                                <option value="User 2">User 2</option>
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
