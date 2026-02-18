import React, { useState } from 'react';
import './ProjectBoard.css';
import { Plus, Minus, X } from 'lucide-react';
import BottomNav from './BottomNav';
import Header from './Header';

const ProjectBoard = () => {
    // 1. STATE FOR PHASES AND TASKS
    const [phases, setPhases] = useState([
        {
            id: 1,
            title: 'Demo',
            tasks: [
                { id: 't1', name: 'Sample task', description: 'This is a sample task description.', completed: false },
                { id: 't2', name: 'Sample task', description: 'This is a sample task description.', completed: false },
                { id: 't3', name: 'Sample task', description: 'This is a sample task description.', completed: false }
            ]
        },
        { id: 2, title: 'Demo', tasks: [] },
        { id: 3, title: 'Demo', tasks: [] }
    ]);

    // 2. STATE FOR MODALS
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
    const [currentPhaseId, setCurrentPhaseId] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);

    // Form state for adding task
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');

    // --- PHASE ACTIONS ---

    const handleAddPhase = () => {
        const newPhase = {
            id: Date.now(),
            title: 'New Phase',
            tasks: []
        };
        setPhases([...phases, newPhase]);
    };

    const handleRemovePhase = (phaseId) => {
        if (window.confirm("Are you sure you want to remove this phase?")) {
            setPhases(phases.filter(p => p.id !== phaseId));
        }
    };

    // --- TASK ACTIONS ---

    const openAddTaskModal = (phaseId) => {
        setCurrentPhaseId(phaseId);
        setNewTaskName('');
        setNewTaskDescription('');
        setIsAddTaskModalOpen(true);
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;

        const newTask = {
            id: `t-${Date.now()}`,
            name: newTaskName,
            description: newTaskDescription,
            completed: false
        };

        setPhases(phases.map(p => {
            if (p.id === currentPhaseId) {
                return { ...p, tasks: [...p.tasks, newTask] };
            }
            return p;
        }));

        setIsAddTaskModalOpen(false);
    };

    const toggleTaskCompletion = (e, phaseId, taskId) => {
        e.stopPropagation(); // Prevent opening description popup
        setPhases(phases.map(p => {
            if (p.id === phaseId) {
                return {
                    ...p,
                    tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
                };
            }
            return p;
        }));
    };

    const viewTaskDetails = (task) => {
        setCurrentTask(task);
        setIsViewTaskModalOpen(true);
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
                                <h6>{phase.title}</h6>
                                <Minus
                                    size={14}
                                    className="cursor-pointer"
                                    onClick={() => handleRemovePhase(phase.id)}
                                />
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
                                        onClick={() => viewTaskDetails(task)}
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
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5>Add New Task</h5>
                            <X
                                size={20}
                                className="cursor-pointer"
                                onClick={() => setIsAddTaskModalOpen(false)}
                            />
                        </div>
                        <form onSubmit={handleAddTask}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Task Name</label>
                                    <input
                                        type="text"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        placeholder="Enter task name"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                        placeholder="Enter task description"
                                        rows="3"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light btn-sm"
                                    onClick={() => setIsAddTaskModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    style={{ backgroundColor: '#1a4d8c' }}
                                >
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Task Modal */}
            {isViewTaskModalOpen && currentTask && (
                <div className="modal-overlay" onClick={() => setIsViewTaskModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h5>Task Details</h5>
                            <X
                                size={20}
                                className="cursor-pointer"
                                onClick={() => setIsViewTaskModalOpen(false)}
                            />
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <div className="fw-bold">{currentTask.name}</div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <div className="description-text">
                                    {currentTask.description || "No description provided."}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ backgroundColor: '#1a4d8c' }}
                                onClick={() => setIsViewTaskModalOpen(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectBoard;
