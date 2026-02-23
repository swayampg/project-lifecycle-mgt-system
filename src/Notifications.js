// 🔹 FILE: src/pages/Notifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';
import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { respondToInvitation } from './services/db_services';
import BottomNav from './BottomNav';
import Header from './Header';
import { Check, X, Bell } from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    // --- FETCH DATA FROM FIREBASE ---
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);

                // 1. General Notifications Listener
                const notifQuery = query(
                    collection(db, "notifications"),
                    where("recipientUid", "==", user.uid),
                    orderBy("createdAt", "desc")
                );

                const unsubscribeNotifs = onSnapshot(notifQuery, (snapshot) => {
                    setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });

                // 2. Project Invitations Listener
                const inviteQuery = query(
                    collection(db, "invitations"),
                    where("recipientUid", "==", user.uid),
                    where("status", "==", "pending")
                );

                const unsubscribeInvites = onSnapshot(inviteQuery, (snapshot) => {
                    setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    setLoading(false);
                });

                return () => {
                    unsubscribeNotifs();
                    unsubscribeInvites();
                };
            } else {
                navigate('/');
            }
        });

        return () => unsubscribeAuth();
    }, [navigate]);

    const handleInviteResponse = async (invite, accept) => {
        try {
            await respondToInvitation(invite, accept);
            if (accept) {
                alert(`Joined project: ${invite.projectName}`);
            }
        } catch (error) {
            console.error("Error responding to invitation:", error);
        }
    };

    // Filter logic for general notifications
    const filteredNotifs = notifications.filter(n =>
        filter === 'ALL' ? true : !n.isRead
    );

    return (
        <div className="dashboard-container">
            <Header />

            <div className="container mt-4 pb-5">
                <div className="notification-wrapper p-4 shadow-sm bg-white rounded-3">

                    {/* --- TOP HEADER: Title & Filters --- */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Notifications</h5>

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

                    {/* --- PROJECT INVITATIONS SECTION --- */}
                    {invitations.length > 0 && (
                        <div className="invitations-section mb-5">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <Bell className="text-primary" size={20} />
                                <h6 className="fw-bold mb-0">Project Invitations</h6>
                            </div>
                            <div className="row g-3">
                                {invitations.map((invite) => (
                                    <div key={invite.id} className="col-12">
                                        <div className="invite-card p-3 border rounded shadow-sm bg-light d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-bold text-primary h6 mb-1">{invite.projectName}</div>
                                                <div className="small text-muted">
                                                    Invited by <strong>{invite.senderName}</strong> as <strong>{invite.role}</strong>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-success btn-sm d-flex align-items-center gap-1 px-3"
                                                    onClick={() => handleInviteResponse(invite, true)}
                                                >
                                                    <Check size={16} /> Accept
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 px-3"
                                                    onClick={() => handleInviteResponse(invite, false)}
                                                >
                                                    <X size={16} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <hr className="my-4" />
                        </div>
                    )}

                    {/* --- GENERAL NOTIFICATIONS LIST --- */}
                    <div className="notification-list">
                        <h6 className="fw-bold text-muted mb-3">General Activity</h6>
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filteredNotifs.length > 0 ? (
                            filteredNotifs.map((item) => (
                                <div key={item.id} className="notification-item d-flex align-items-center gap-3 py-3 border-bottom">
                                    <img
                                        src={item.senderPhoto || 'https://via.placeholder.com/50'}
                                        alt="User"
                                        className="rounded-circle"
                                        style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                    />
                                    <div className="flex-grow-1">
                                        <p className="mb-0 small">
                                            <span className="fw-bold text-dark">{item.senderName}</span> {item.message}
                                        </p>
                                        <span className="text-muted" style={{ fontSize: '10px' }}>
                                            {item.createdAt?.toDate().toLocaleDateString()}
                                        </span>
                                    </div>
                                    {!item.isRead && <div className="unread-dot bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 text-muted small">
                                {invitations.length === 0 ? "You're all caught up! No notifications." : "No general notifications."}
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