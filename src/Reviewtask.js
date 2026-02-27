import React, { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { updateReviewStatus, sendNotification, updateProjectTask } from './services/db_services';
import './Reviewtask.css';

const ReviewTask = ({ show, handleClose, review, onReviewComplete }) => {
    const [mentorComment, setMentorComment] = useState(review?.mentorComment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState(null);

    if (!show || !review) return null;

    const getRecipientUid = async () => {
        const q = query(
            collection(db, 'projectMembers'),
            where('projectId', '==', review.projectId),
            where('fullName', '==', review.assignTo)
        );
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].data().uid;

        const uq = query(
            collection(db, 'users'),
            where('fullName', '==', review.assignTo)
        );
        const usnap = await getDocs(uq);
        if (!usnap.empty) return usnap.docs[0].data().uid || usnap.docs[0].id;

        return null;
    };

    const handleAction = async (actionType) => {
        setIsSubmitting(true);
        try {
            const newStatus = actionType === 'reviewed' ? 'reviewed' : 'changes_requested';

            await updateReviewStatus(review.id, newStatus, mentorComment);

            if (review.taskId) {
                await updateProjectTask(review.taskId, {
                    reviewStatus: newStatus,
                    mentorComment,
                });
            }

            const recipientUid = await getRecipientUid();
            if (recipientUid) {
                const mentor = auth.currentUser;
                const message =
                    actionType === 'reviewed'
                        ? `marked your task "${review.taskName}" as reviewed ✅`
                        : `requested changes on your task "${review.taskName}" 🔄${mentorComment ? ` — "${mentorComment}"` : ''}`;

                await sendNotification({
                    recipientUid,
                    senderName: mentor?.displayName || 'Mentor',
                    senderPhoto: mentor?.photoURL || '',
                    message,
                    type: actionType === 'reviewed' ? 'task_reviewed' : 'changes_requested',
                    projectId: review.projectId,
                    taskId: review.taskId,
                });
            }

            onReviewComplete();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const photos = review.media?.photos || [];
    const videos = review.media?.videos || [];
    const hasMedia = photos.length > 0 || videos.length > 0;
    const isAlreadyReviewed = review.reviewStatus !== 'pending';

    const priorityColor =
        review.priority === 'High'
            ? '#dc3545'
            : review.priority === 'Medium'
            ? '#fd7e14'
            : '#28a745';

    return (
        <>
            {/* ── Lightbox ── */}
            {lightboxSrc && (
                <div className="review-lightbox" onClick={() => setLightboxSrc(null)}>
                    <img src={lightboxSrc} alt="preview" />
                    <span className="review-lightbox-close">✕</span>
                </div>
            )}

            {/* ── Blurred Backdrop ── */}
            <div className="review-modal-backdrop" onClick={handleClose} />

            {/* ── Modal Wrapper ── */}
            <div className="review-modal-wrapper">
                <div
                    className="review-modal-box"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Header ── */}
                    <div className="review-modal-header">
                        <h5>Review Task</h5>
                        <button className="review-modal-close" onClick={handleClose}>✕</button>
                    </div>

                    {/* ── Body ── */}
                    <div className="review-modal-body">

                        {/* Row 1: Title | Status | Priority */}
                        <div className="review-top-row">
                            <div className="review-field">
                                <label>Title <span className="req">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={review.taskName}
                                    readOnly
                                />
                            </div>
                            <div className="review-field">
                                <label>Status <span className="req">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={review.status}
                                    readOnly
                                />
                            </div>
                            <div className="review-field">
                                <label>Priority <span className="req">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={review.priority}
                                    readOnly
                                    style={{ color: priorityColor, fontWeight: 700 }}
                                />
                            </div>
                        </div>

                        {/* Row 2: Description | Comments */}
                        <div className="review-mid-row">
                            <div className="review-field">
                                <label>Description</label>
                                <textarea
                                    className="form-control"
                                    value={review.description || ''}
                                    readOnly
                                />
                            </div>
                            <div className="review-field">
                                <label>
                                    Comments
                                    {isAlreadyReviewed && (
                                        <span className="read-only-tag"> (read-only)</span>
                                    )}
                                </label>
                                <textarea
                                    className={`form-control${isAlreadyReviewed ? '' : ' editable'}`}
                                    placeholder="Add your feedback or comments for the student..."
                                    value={mentorComment}
                                    onChange={(e) => setMentorComment(e.target.value)}
                                    readOnly={isAlreadyReviewed}
                                />
                            </div>
                        </div>

                        <hr className="review-divider" />

                        {/* Attachments */}
                        <div className="review-field">
                            <label>Attachments</label>
                            {!hasMedia ? (
                                <div className="review-no-attachments">
                                    No attachments uploaded.
                                </div>
                            ) : (
                                <div className="review-attachments-grid">
                                    {photos.map((src, i) => (
                                        <div
                                            key={`photo-${i}`}
                                            className="review-photo-thumb"
                                            onClick={() => setLightboxSrc(src)}
                                            title="Click to enlarge"
                                        >
                                            <img src={src} alt={`attachment-${i}`} />
                                        </div>
                                    ))}
                                    {videos.map((src, i) => (
                                        <div key={`video-${i}`} className="review-video-thumb">
                                            <video src={src} controls />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assigned Info */}
                        <div className="review-assign-info">
                            Assigned to: <strong>{review.assignTo}</strong>
                            &nbsp;·&nbsp;
                            by: <strong>{review.assignBy}</strong>
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="review-modal-footer">
                        {isAlreadyReviewed ? (
                            <div
                                className="review-status-badge"
                                style={{
                                    background:
                                        review.reviewStatus === 'reviewed' ? '#d4edda' : '#fff3cd',
                                    color:
                                        review.reviewStatus === 'reviewed' ? '#155724' : '#856404',
                                }}
                            >
                                {review.reviewStatus === 'reviewed'
                                    ? '✅ Already Approved'
                                    : '🔄 Changes Already Requested'}
                            </div>
                        ) : (
                            <>
                                <button
                                    className="btn-mark-reviewed"
                                    onClick={() => handleAction('reviewed')}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && (
                                        <span className="spinner" />
                                    )}
                                    Mark as Reviewed
                                </button>
                                <button
                                    className="btn-request-changes"
                                    onClick={() => handleAction('changes_requested')}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && (
                                        <span className="spinner" />
                                    )}
                                    Request Changes
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReviewTask;
