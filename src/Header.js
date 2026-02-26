import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, User as UserIcon } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { doc, collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRoleInProject } from './services/db_services';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ fullName: 'User', role: 'Member', email: '', profilePicture: '' });
    const [projectRole, setProjectRole] = useState(null);
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [latestNews, setLatestNews] = useState(null);

    const [currentUser, setCurrentUser] = useState(null);

    // Auth state listener
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    // User profile listener
    useEffect(() => {
        if (!currentUser) return;

        const userDocRef = doc(db, "users", currentUser.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserData({ ...docSnap.data(), email: currentUser.email });
            }
        });
        return () => unsubscribeUser();
    }, [currentUser]);

    // Project role, invitations and news listener
    useEffect(() => {
        if (!currentUser) return;

        const selectedProjectId = localStorage.getItem('selectedProjectId');
        if (!selectedProjectId) return;

        // Fetch project role
        getUserRoleInProject(selectedProjectId, currentUser.uid).then(setProjectRole);

        // Real-time listener for invitations
        const inviteQuery = query(
            collection(db, "invitations"),
            where("recipientUid", "==", currentUser.uid),
            where("status", "==", "pending")
        );
        const unsubscribeInvites = onSnapshot(inviteQuery, (snapshot) => {
            setNotificationCount(snapshot.size);
        });

        // Real-time news listener
        const newsQuery = query(
            collection(db, "news"),
            where("prjid", "==", selectedProjectId),
            orderBy("createdAt", "desc"),
            limit(1)
        );
        const unsubscribeNews = onSnapshot(newsQuery, (snapshot) => {
            if (!snapshot.empty) {
                setLatestNews(snapshot.docs[0].data());
            }
        }, (error) => {
            console.error("Header news listener error:", error);
        });

        return () => {
            unsubscribeInvites();
            unsubscribeNews();
        };
    }, [currentUser]);

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
            <div className="header-left-group d-flex align-items-center gap-5">
                <div
                    className="header-profile-section d-flex align-items-center"
                    onClick={togglePopup}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    {/* CHANGED: Dynamic image source from userData */}
                    {userData.profilePicture ? (
                        <img
                            src={userData.profilePicture}
                            alt="Profile"
                            className="me-2 rounded-circle"
                            style={{ width: '35px', height: '35px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="me-2 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                            <UserIcon size={20} color="#878d9fff" />
                        </div>
                    )}

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
                                {/* CHANGED: Dynamic image in popup */}
                                {userData.profilePicture ? (
                                    <img
                                        src={userData.profilePicture}
                                        alt="Profile Large"
                                        className="rounded-circle me-3"
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="rounded-circle me-3 bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                        <UserIcon size={30} color="#878d9fff" />
                                    </div>
                                )}
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

                <div className="header-news-ticker">
                    {latestNews ? (
                        <div className="ticker-content">
                            <span className="ticker-label">LATEST NEWS:</span>
                            <span className="ticker-message">{latestNews.message}</span>
                        </div>
                    ) : (
                        <div className="ticker-content empty">
                            <span className="ticker-message">No news updates yet</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="header-actions d-flex align-items-center gap-3">
                <div style={{ position: 'relative' }}>
                    <Bell
                        size={20}
                        className="header-icon cursor-pointer"
                        onClick={() => navigate('/notifications')}
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
                />
            </div>
        </header >
    );
};

export default Header;