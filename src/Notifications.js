// 🔹 FILE: src/pages/Notifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';
import { db } from './firebaseConfig'; // Ensure this file exists with your Firebase keys
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import BottomNav from './BottomNav';
import Header from './Header';

const Notifications = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('ALL'); // Toggle between 'ALL' and 'UNREAD'

    // --- FETCH DATA FROM FIREBASE ---
    useEffect(() => {
        // Create a query to get notifications ordered by newest first
        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(data);
        });

        // Cleanup listener when page is closed
        return () => unsubscribe();
    }, []);

    // Filter logic for the UI
    const filteredData = notifications.filter(n => 
        filter === 'ALL' ? true : !n.isRead
    );

    return (
        <div className="dashboard-container">
            {/* 🔹 Reuse your existing Header */}
            <Header />

            <div className="container mt-4">
                {/* --- NOTIFICATION WHITE CARD --- */}
                <div className="notification-wrapper p-4 shadow-sm bg-white">
                    
                    {/* Header with Filter Buttons */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="fw-bold mb-0">Notifications</h4>
                        
                        <div className="filter-toggle-group">
                            <button 
                                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setFilter('ALL')}
                            >
                                ALL
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'UNREAD' ? 'active' : ''}`}
                                onClick={() => setFilter('UNREAD')}
                            >
                                UNREAD
                            </button>
                        </div>
                    </div>

                    <hr />

                    {/* --- LIST AREA --- */}
                    <div className="notification-list">
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <div key={item.id} className="notification-item d-flex align-items-center gap-3 py-3 border-bottom">
                                    {/* User Avatar */}
                                    <img 
                                        src={item.senderPhoto || 'https://via.placeholder.com/50'} 
                                        alt="User" 
                                        className="rounded-circle"
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                    {/* Text Content */}
                                    <div>
                                        <p className="mb-0">
                                            <span className="fw-bold">{item.senderName}</span> {item.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 text-muted">
                                No notifications found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 🔹 Reuse your existing BottomNav */}
            <BottomNav />
        </div>
    );
};

export default Notifications;