import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRoleInProject } from './services/db_services';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ fullName: 'User', role: 'Member', email: '' });
    const [projectRole, setProjectRole] = useState(null);
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    // Fetch user profile data from Firebase
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch user profile
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData({ ...docSnap.data(), email: user.email });
                }

                // Check for project context
                const selectedProjectId = localStorage.getItem('selectedProjectId');
                if (selectedProjectId) {
                    const role = await getUserRoleInProject(selectedProjectId, user.uid);
                    setProjectRole(role);
                } else {
                    setProjectRole(null);
                }

                // Real-time listener for invitations
                const inviteQuery = query(
                    collection(db, "invitations"),
                    where("recipientUid", "==", user.uid),
                    where("status", "==", "pending")
                );
                const unsubscribeInvites = onSnapshot(inviteQuery, (snapshot) => {
                    const count = snapshot.size;
                    // We can add unread notifications count here too if that collection is ready
                    setNotificationCount(count);
                });

                return () => {
                    unsubscribeInvites();
                };
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfilePopupOpen && !event.target.closest('.header-profile-section') && !event.target.closest('.profile-dropdown-popup')) {
                setIsProfilePopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfilePopupOpen]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const togglePopup = (e) => {
        e.stopPropagation();
        setIsProfilePopupOpen(!isProfilePopupOpen);
    };

    return (
        <header className="main-header d-flex justify-content-between align-items-center">
            {/* --- PROFILE SECTION --- */}
            <div
                className="header-profile-section d-flex align-items-center"
                onClick={togglePopup}
                style={{ cursor: 'pointer', position: 'relative' }}
            >
                <img
                    src="https://via.placeholder.com/150"
                    alt="Profile"
                    className="me-2 rounded-circle"
                    style={{ width: '35px', height: '35px' }}
                />
                <div>
                    <div className="fw-bold small text-nowrap">{userData.fullName}</div>
                    {projectRole && (
                        <div className="small opacity-75" style={{ fontSize: '11px' }}>
                            {projectRole}
                        </div>
                    )}
                </div>

                {isProfilePopupOpen && (
                    <div className="profile-dropdown-popup shadow" onClick={(e) => e.stopPropagation()}>
                        <div className="profile-popup-header d-flex align-items-center mb-3">
                            <img
                                src="https://via.placeholder.com/150"
                                alt="Profile Large"
                                className="rounded-circle me-3"
                                style={{ width: '50px', height: '50px' }}
                            />
                            <div className="overflow-hidden">
                                <div className="fw-bold text-dark text-truncate">{userData.fullName}</div>
                                <div className="text-muted small text-truncate">{userData.email}</div>
                            </div>
                        </div>
                        <div className="profile-popup-options">
                            <button className="popup-option-btn" onClick={() => navigate('/profile')}>
                                View Profile
                            </button>
                            <button className="popup-option-btn" onClick={() => navigate('/Mytask')}>
                                My Tasks
                            </button>
                            <button className="popup-option-btn" onClick={() => navigate('/notifications')}>
                                Notifications
                            </button>
                            <hr className="my-2" />
                            <button className="popup-option-btn logout-btn" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SEARCH BOX --- */}
            <div className="header-search-box">
                <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0">
                        <Search size={14} />
                    </span>
                    <input
                        type="text"
                        className="form-control border-start-0 shadow-none"
                        placeholder="Search"
                    />
                </div>
            </div>

            {/* --- ACTION ICONS --- */}
            <div className="header-actions d-flex align-items-center gap-3">
                <div style={{ position: 'relative' }}>
                    <Bell
                        size={20}
                        className="header-icon cursor-pointer"
                        onClick={() => navigate('/notifications')}
                        style={{ cursor: 'pointer' }}
                    />
                    {notificationCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-danger"
                            style={{ fontSize: '10px', padding: '4px 6px', marginTop: '2px' }}>
                            {notificationCount}
                        </span>
                    )}
                </div>
                <Settings
                    size={20}
                    className="header-icon cursor-pointer"
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </header>
    );
};

export default Header;