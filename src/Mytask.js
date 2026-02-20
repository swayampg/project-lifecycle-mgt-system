import React, { useState, useEffect } from 'react';
import './Mytask.css'; 
import { Calendar } from 'lucide-react'; // Kept Calendar for the list
import Header from './Header'; // 🔹 Using your new component
import BottomNav from './BottomNav'; // 🔹 Using your new component

const Mytask = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        setTasks([
            { 
                id: '1', 
                title: 'Demo Task', 
                dueDate: '20-02-2026', 
                status: 'In progress' 
            },
            { 
                id: '2', 
                title: 'Demo Task', 
                dueDate: '02-03-2026', 
                status: 'Completed' 
            }
        ]);
    }, []);

    return (
        <div className="dashboard-wrapper">
            {/* 🔹 Replaced manual header with your Component */}
            <Header />

            <main className="task-main-card">
                <h2 className="section-title">My Task</h2>
                
                <div className="task-list-container">
                    {tasks.map((task) => (
                        <div key={task.id} className="task-item-card">
                            <h3 className="task-name">{task.title}</h3>
                            <div className="task-meta-row">
                                <div className="due-date-info">
                                    <Calendar size={14} />
                                    <span>Due : {task.dueDate}</span>
                                </div>
                                <span className={`badge-status ${
                                    task.status === 'In progress' 
                                        ? 'bg-orange' 
                                        : 'bg-green'
                                }`}>
                                    {task.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    
                    <div className="task-item-card empty-placeholder"></div>
                </div>
            </main>

            {/* 🔹 Replaced manual nav with your Component */}
            <BottomNav />
        </div>
    );
};

export default Mytask;