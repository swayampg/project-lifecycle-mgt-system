import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { Send } from 'lucide-react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { getUserRoleInProject, addNews } from './services/db_services';
import './mentorDashboard.css';

const MentorDashboard = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [newsText, setNewsText] = useState('');
    const [mentorNews, setMentorNews] = useState([]);

    useEffect(() => {
        let unsubscribe = null;
        const checkAccess = async () => {
            const user = auth.currentUser;
            const selectedProjectId = localStorage.getItem('selectedProjectId');
            if (user && selectedProjectId) {
                const userRole = await getUserRoleInProject(selectedProjectId, user.uid);
                if (userRole === 'Mentor') {
                    setIsAuthorized(true);

                    const q = query(
                        collection(db, "news"),
                        where("prjid", "==", selectedProjectId),
                        orderBy("createdAt", "desc")
                    );
                    unsubscribe = onSnapshot(q, (snapshot) => {
                        const news = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setMentorNews(news);
                    }, (error) => {
                        console.error("News listener error:", error);
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
            if (unsubscribe) unsubscribe();
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

    if (!isAuthorized) return null;

    return (
        <div className="mentor-dashboard-container">
            <Header />

            <main className="dashboard-content">
                <div className="main-section">
                    <h1 className="project-title">Project Name</h1>

                    <div className="task-card">
                        <div className="task-card-header to-be-reviewed">
                            To be Reviewed
                        </div>
                        <div className="task-card-body">
                            {/* To be reviewed items will appear here */}
                        </div>
                    </div>

                    <div className="task-card">
                        <div className="task-card-header reviewed">
                            Reviewed
                        </div>
                        <div className="task-card-body">
                            {/* Reviewed items would go here */}
                        </div>
                    </div>
                </div>

                <aside className="news-sidebar">
                    <div className="news-card">
                        <div className="news-header">
                            News
                        </div>
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
                                                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
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
        </div>
    );
};

export default MentorDashboard;
