import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { Send, CheckCircle } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { getUserRoleInProject, addNews, updateProjectStatus } from './services/db_services';
import ReviewTask from './Reviewtask';
import Swal from 'sweetalert2';
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
    const [isCompleting, setIsCompleting] = useState(false);
    const [projectStatus, setProjectStatus] = useState(null);
    const [progress, setProgress] = useState(0);
    const [projectData, setProjectData] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let unsubNews = null;
        let unsubReviews = null;
        let unsubProject = null;

        const setupListeners = async () => {
            const user = auth.currentUser;
            const selectedProjectId = localStorage.getItem('selectedProjectId');

            if (user && selectedProjectId) {
                const userRole = await getUserRoleInProject(selectedProjectId, user.uid);

                if (userRole === 'Mentor') {
                    setIsAuthorized(true);

                    // News listener
                    const newsQ = query(
                        collection(db, "news"),
                        where("prjid", "==", selectedProjectId),
                        orderBy("createdAt", "desc")
                    );
                    unsubNews = onSnapshot(newsQ, { serverTimestamps: 'estimate' }, (snapshot) => {
                        setMentorNews(snapshot.docs.map(doc => ({ 
                            id: doc.id, 
                            ...doc.data() 
                        })));
                    });

                    // Real-time reviews listener
                    const reviewsQ = query(
                        collection(db, "reviews"),
                        where("projectId", "==", selectedProjectId)
                    );
                    unsubReviews = onSnapshot(reviewsQ, (snapshot) => {
                        const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setPendingTasks(allReviews.filter(r => r.reviewStatus === 'pending'));
                        setReviewedTasks(allReviews.filter(r => r.reviewStatus === 'reviewed' || r.reviewStatus === 'changes_requested'));
                        setLoadingReviews(false);
                    });

                    // Project status and progress listener
                    const projectQ = query(collection(db, "projects"), where("proj_id", "==", selectedProjectId));
                    unsubProject = onSnapshot(projectQ, async (snapshot) => {
                        if (!snapshot.empty) {
                            const projData = snapshot.docs[0].data();
                            setProjectStatus(projData.status);
                            setProjectData(projData);

                            // Calculate progress
                            const phasesQuery = query(collection(db, "project-phases"), where("proj_id", "==", selectedProjectId));
                            const phasesSnapshot = await getDocs(phasesQuery);
                            const phaseIds = phasesSnapshot.docs.map(doc => doc.id);

                            if (phaseIds.length > 0) {
                                const tasksQuery = query(collection(db, "Tasks"), where("phaseId", "in", phaseIds));
                                const tasksSnapshot = await getDocs(tasksQuery);
                                const allTasks = tasksSnapshot.docs.map(doc => doc.data());
                                if (allTasks.length > 0) {
                                    const completedCount = allTasks.filter(t => t.completed).length;
                                    setProgress(Math.round((completedCount / allTasks.length) * 100));
                                } else {
                                    setProgress(0);
                                }
                            } else {
                                setProgress(0);
                            }
                        }
                    });
                } else {
                    navigate('/home');
                }
            } else {
                navigate('/');
            }
        };

        setupListeners();

        return () => {
            if (unsubNews) unsubNews();
            if (unsubReviews) unsubReviews();
            if (unsubProject) unsubProject();
        };
    }, [navigate]);

    const newsListRef = React.useRef(null);

    // Auto-scroll to bottom when new news arrives
    useEffect(() => {
        if (newsListRef.current) {
            newsListRef.current.scrollTop = newsListRef.current.scrollHeight;
        }
    }, [mentorNews]);

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

    const handleCompleteProject = async () => {
        const selectedProjectId = localStorage.getItem('selectedProjectId');
        if (!selectedProjectId) return;

        const result = await Swal.fire({
            title: 'Complete Project?',
            text: "This will mark the project as completed and move it to the Global Archive. This action is irreversible.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Mark as Completed'
        });

        if (result.isConfirmed) {
            setIsCompleting(true);
            try {
                const completedDate = new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                await updateProjectStatus(selectedProjectId, 'Completed', completedDate);
                Swal.fire('Success!', 'Project has been marked as completed.', 'success');
            } catch (error) {
                console.error("Failed to update project status:", error);
                Swal.fire('Error', 'Failed to update project status.', 'error');
            } finally {
                setIsCompleting(false);
            }
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

    const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        
        const past = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((currentTime - past) / 1000);
        
        if (seconds < 60) return `${Math.max(0, seconds)} sec${seconds !== 1 ? 's' : ''} ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
        
        return past.toLocaleDateString();
    };

    return (
        <div className="mentor-dashboard-container">
            <Header />

            <main className="dashboard-content">
                <div className="main-section">
                    <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white shadow-sm" style={{ borderRadius: '16px' }}>
                        <div className="project-info-header">
                            <h1 className="project-title mb-1" style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a4d8c' }}>
                                {projectData?.Name || 'Mentor Dashboard'}
                            </h1>
                            <div className="project-header-meta d-flex gap-3 align-items-center flex-wrap">
                                {projectData?.category && (
                                    <span className="badge bg-primary-soft text-primary px-3 py-1" style={{ fontSize: '0.75rem', background: '#e0e7ff', borderRadius: '50px' }}>
                                        {projectData.category}
                                    </span>
                                )}
                                {projectData?.department && (
                                    <span className="badge bg-warning-soft text-warning px-3 py-1" style={{ fontSize: '0.75rem', background: '#fef3c7', borderRadius: '50px', color: '#92400e' }}>
                                        {projectData.department}
                                    </span>
                                )}
                                <span className="leader-info" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Leader: <strong>{projectData?.leaderName || projectData?.projectLeader || 'N/A'}</strong>
                                </span>
                                <div className="date-info d-flex gap-2" style={{ fontSize: '0.85rem', color: '#64748b', borderLeft: '1px solid #e2e8f0', paddingLeft: '15px' }}>
                                    <span>{projectData?.startDate}</span>
                                    <span>-</span>
                                    <span>{projectData?.endDate}</span>
                                </div>
                            </div>
                        </div>
                        {projectStatus === 'Completed' ? (
                            <span className="badge bg-success d-flex align-items-center gap-2 py-2 px-3" style={{ borderRadius: '10px' }}>
                                <CheckCircle size={18} /> Completed
                            </span>
                        ) : (
                            <button
                                className="btn btn-success d-flex align-items-center gap-2"
                                onClick={handleCompleteProject}
                                disabled={isCompleting || progress < 100}
                                style={{ borderRadius: '10px', padding: '8px 20px', fontWeight: 600, opacity: (isCompleting || progress < 100) ? 0.6 : 1 }}
                                title={progress < 100 ? `Project progress must be 100% to complete (Current: ${progress}%)` : ""}
                            >
                                {isCompleting ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm" role="status" /> Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> Mark as Completed
                                    </>
                                )}
                            </button>
                        )}
                    </div>

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
                            <div className="news-list" ref={newsListRef}>
                                {[...mentorNews].reverse().map(item => (
                                    <div key={item.id} className="news-item animate-fade-in">
                                        <div className="news-avatar" style={{ backgroundColor: '#1a4d8c' }}>
                                            <div className="icon-placeholder">👤</div>
                                        </div>
                                        <div className="news-info">
                                            <div className="news-info-top">
                                                <span className="news-name">{item.senderName}</span>
                                                <span className="news-time">
                                                    {getRelativeTime(item.createdAt)}
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
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSendNews();
                                            }
                                        }}
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
