import React, { useState } from 'react';
import { auth, db } from './firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { updateReviewStatus, sendNotification, updateProjectTask, logProjectAction } from './services/db_services';
import Swal from 'sweetalert2';
import './Reviewtask.css';


const ReviewTask = ({ show, handleClose, review, onReviewComplete }) => {
    const [mentorComment, setMentorComment] = useState(review?.mentorComment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    if (!show || !review) return null;

    const getRecipientUid = async () => {
        const q = query(
            collection(db, 'projectTeam'),
            where('prjid', '==', review.projectId),
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
                    completed: actionType === 'reviewed' // Auto-check if approved, uncheck if changes requested
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

            const mentorObj = auth.currentUser;
            await logProjectAction(
                review.projectId,
                mentorObj?.displayName || 'Mentor',
                actionType === 'reviewed' ? "Task Approved" : "Task Changes Requested",
                actionType === 'reviewed' ? `Approved task "${review.taskName}"` : `Requested changes for task "${review.taskName}"`
            );

            onReviewComplete();
        } catch (error) {
            console.error('Error submitting review:', error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Error',
                text: 'Something went wrong. Please try again.',
                confirmButtonColor: '#1a4d8c'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAlreadyReviewed = review.reviewStatus !== 'pending';

    const priorityColor =
        review.priority === 'High'
            ? '#dc3545'
            : review.priority === 'Medium'
                ? '#fd7e14'
                : '#28a745';

    return (
        <>
            {/* ── PDF Viewer Modal ── */}
            {pdfUrl && (
                <div className="review-pdf-modal-overlay" onClick={() => setPdfUrl(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="review-pdf-modal-container" onClick={(e) => e.stopPropagation()} style={{ background: 'white', width: '90%', height: '95%', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="review-pdf-modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>Document Viewer - {pdfUrl.split('/').pop().split('?')[0]}</span>
                            <button className="review-pdf-close-btn" onClick={() => setPdfUrl(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div className="review-pdf-modal-body" style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <iframe 
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`} 
                                title="PDF Preview" 
                                style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} 
                            />
                            <div style={{ padding: '8px', textAlign: 'center', background: '#f1f5f9', fontSize: '12px', color: '#475569' }}>
                                Can't see the preview? <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Open in new tab</a>
                            </div>
                        </div>
                    </div>
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
                                <label>Title <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={review.taskName}
                                    readOnly
                                />
                            </div>
                            <div className="review-field">
                                <label>Status <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={review.status}
                                    readOnly
                                />
                            </div>
                            <div className="review-field">
                                <label>Priority <span className="required-star">*</span></label>
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
                                <label>Student Comments / Links</label>
                                <textarea
                                    className="form-control"
                                    value={review.taskComment || 'No comments or links provided.'}
                                    readOnly
                                    style={{ backgroundColor: '#f8f9fa' }}
                                />
                            </div>
                        </div>

                        {/* [NEW] Attachments Section for Review */}
                        {review.media?.files?.length > 0 && (
                            <div className="review-field mt-3">
                                <label>Attachments</label>
                                <div className="existing-files-grid mt-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {review.media.files.map((file, idx) => {
                                        const isImage = /\.(jpe?g|png|gif|webp)$/i.test(file.name);
                                        const isPdf = /\.pdf$/i.test(file.name);
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => {
                                                    if (isPdf) {
                                                        setPdfUrl(file.url);
                                                    } else {
                                                        window.open(file.url, '_blank');
                                                    }
                                                }} 
                                                style={{ textDecoration: 'none', cursor: 'pointer' }}
                                            >
                                                <div className="media-thumb shadow-sm" style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative', background: '#fff' }}>
                                                    {isImage ? (
                                                        <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : isPdf ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fef2f2', fontSize: '9px', textAlign: 'center', padding: '4px', color: '#991b1b' }}>
                                                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>📕</span>
                                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontWeight: 700 }}>{file.name}</div>
                                                            <div style={{ fontSize: '7px', marginTop: '2px', opacity: 0.7 }}>PDF View</div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', fontSize: '9px', textAlign: 'center', padding: '4px' }}>
                                                            <span style={{ fontSize: '24px', marginBottom: '4px' }}>📄</span>
                                                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{file.name}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="review-field mt-3">
                            <label>
                                Mentor Feedback
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
