import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { Send } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getUserRoleInProject, addNews } from './services/db_services';
import { getReviewsByProject } from './services/db_services';
import ReviewTask from './Reviewtask';
import './mentorDashboard.css';

const MentorDashboard = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [newsText, setNewsText] = useState('');
    const [mentorNews, setMentorNews] = useState([]);

    // ✅ Review state
    const [pendingTasks, setPendingTasks] = useState([]);
    const [reviewedTasks, setReviewedTasks] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        let unsubscribeNews = null;
        let unsubscribeReviews = null;

        const checkAccess = async () => {
            const user = auth.currentUser;
            const selectedProjectId = localStorage.getItem('selectedProjectId');

            if (user && selectedProjectId) {
                const userRole = await getUserRoleInProject(selectedProjectId, user.uid);

                if (userRole === 'Mentor') {
                    setIsAuthorized(true);

                    // News listener
                    const q = query(
                        collection(db, "news"),
                        where("prjid", "==", selectedProjectId),
                        orderBy("createdAt", "desc")
                    );
                    unsubscribeNews = onSnapshot(q, (snapshot) => {
                        setMentorNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    });

                    // ✅ Real-time reviews listener
                    const reviewsQuery = query(
                        collection(db, "reviews"),
                        where("projectId", "==", selectedProjectId)
                    );
                    unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
                        const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setPendingTasks(allReviews.filter(r => r.reviewStatus === 'pending'));
                        setReviewedTasks(allReviews.filter(r => r.reviewStatus === 'reviewed' || r.reviewStatus === 'changes_requested'));
                        setLoadingReviews(false);
                    });

                } else {
                    navigate('/home');
                }
            } else {
                navigate('/');
            }
        };

        checkAccess();

        return () => {
            if (unsubscribeNews) unsubscribeNews();
            if (unsubscribeReviews) unsubscribeReviews();
        };
    }, [navigate]);

    const handleSendNews = async () => {
        if (!newsText.trim()) return;
        try {
            const selectedProjectId = localStorage.getItem('selectedProjectId');
            await addNews({
                prjid: selectedProjectId,
                message: newsText,
                senderName: auth.currentUser.displayName || 'Mentor'
            });
            setNewsText('');
        } catch (error) {
            console.error("Failed to send news:", error);
        }
    };

    const openReviewModal = (review) => {
        setSelectedReview(review);
        setIsReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setSelectedReview(null);
        setIsReviewModalOpen(false);
    };

    // Called after mentor marks as reviewed / requests changes — UI updates via real-time listener
    const handleReviewComplete = () => {
        closeReviewModal();
    };

    if (!isAuthorized) return null;

    const getPriorityBadge = (priority) => {
        const colors = { High: '#dc3545', Medium: '#fd7e14', Low: '#28a745' };
        return (
            <span style={{
                background: colors[priority] || '#6c757d',
                color: 'white',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600
            }}>
                {priority || 'N/A'}
            </span>
        );
    };

    return (
        <div className="mentor-dashboard-container">
            <Header />

            <main className="dashboard-content">
                <div className="main-section">
                    <h1 className="project-title">Mentor Dashboard</h1>

                    {/* ── To Be Reviewed ── */}
                    <div className="task-card">
                        <div className="task-card-header to-be-reviewed">
                            To be Reviewed
                            {pendingTasks.length > 0 && (
                                <span style={{
                                    background: 'white',
                                    color: '#1a4d8c',
                                    borderRadius: '12px',
                                    padding: '2px 10px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    marginLeft: '10px'
                                }}>
                                    {pendingTasks.length}
                                </span>
                            )}
                        </div>
                        <div className="task-card-body">
                            {loadingReviews ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status" />
                                </div>
                            ) : pendingTasks.length === 0 ? (
                                <p className="text-muted text-center py-3" style={{ fontSize: '13px' }}>
                                    No tasks pending review.
                                </p>
                            ) : (
                                pendingTasks.map((review) => (
                                    <div
                                        key={review.id}
                                        className="mentor-task-row"
                                        onClick={() => openReviewModal(review)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            borderRadius: '8px',
                                            marginBottom: '4px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e3a5f' }}>
                                                {review.taskName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                                Assigned to: {review.assignTo} &nbsp;·&nbsp; by {review.assignBy}
                                            </div>
                                        </div>
                                        {getPriorityBadge(review.priority)}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Reviewed / Changes Requested ── */}
                    <div className="task-card">
                        <div className="task-card-header reviewed">
                            Reviewed
                            {reviewedTasks.length > 0 && (
                                <span style={{
                                    background: 'white',
                                    color: '#1a4d8c',
                                    borderRadius: '12px',
                                    padding: '2px 10px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    marginLeft: '10px'
                                }}>
                                    {reviewedTasks.length}
                                </span>
                            )}
                        </div>
                        <div className="task-card-body">
                            {reviewedTasks.length === 0 ? (
                                <p className="text-muted text-center py-3" style={{ fontSize: '13px' }}>
                                    No reviewed tasks yet.
                                </p>
                            ) : (
                                reviewedTasks.map((review) => (
                                    <div
                                        key={review.id}
                                        className="mentor-task-row"
                                        onClick={() => openReviewModal(review)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            borderBottom: '1px solid #f0f0f0',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            borderRadius: '8px',
                                            marginBottom: '4px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e3a5f' }}>
                                                {review.taskName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                                Assigned to: {review.assignTo}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getPriorityBadge(review.priority)}
                                            <span style={{
                                                background: review.reviewStatus === 'reviewed' ? '#d4edda' : '#fff3cd',
                                                color: review.reviewStatus === 'reviewed' ? '#155724' : '#856404',
                                                borderRadius: '6px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 600
                                            }}>
                                                {review.reviewStatus === 'reviewed' ? '✅ Approved' : '🔄 Changes'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── News Sidebar ── */}
                <aside className="news-sidebar">
                    <div className="news-card">
                        <div className="news-header">News</div>
                        <div className="news-body">
                            <div className="news-list">
                                {mentorNews.map(item => (
                                    <div key={item.id} className="news-item">
                                        <div className="news-avatar" style={{ backgroundColor: '#1a4d8c' }}>
                                            <div className="icon-placeholder">👤</div>
                                        </div>
                                        <div className="news-info">
                                            <div className="news-info-top">
                                                <span className="news-name">{item.senderName}</span>
                                                <span className="news-time">
                                                    {item.createdAt?.toDate
                                                        ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : 'Just now'}
                                                </span>
                                            </div>
                                            <p className="news-message">{item.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="release-note-section">
                                <div className="release-note-input-container">
                                    <input
                                        type="text"
                                        placeholder="Release note"
                                        className="release-note-input"
                                        value={newsText}
                                        onChange={(e) => setNewsText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendNews()}
                                    />
                                    <button className="release-note-send-btn" onClick={handleSendNews}>
                                        <Send size={18} color="white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <BottomNav />

            {/* ── ReviewTask Modal ── */}
            {isReviewModalOpen && selectedReview && (
                <ReviewTask
                    show={isReviewModalOpen}
                    handleClose={closeReviewModal}
                    review={selectedReview}
                    onReviewComplete={handleReviewComplete}
                />
            )}
        </div>
    );
};

export default MentorDashboard;
