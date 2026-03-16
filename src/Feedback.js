import React, { useState, useEffect } from 'react';
import { Star, Upload, Check } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { submitFeedback } from './services/db_services';
import Swal from 'sweetalert2';
import './Feedback.css';


const Feedback = () => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [types, setTypes] = useState([]);
    const [description, setDescription] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const feedbackOptions = [
        { id: 'bug', label: 'Bug report' },
        { id: 'ui', label: 'UI issue' },
        { id: 'feature', label: 'New Feature' },
        { id: 'others', label: 'Others' }
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setName(userDoc.data().fullName || '');
                    setEmail(user.email || '');
                }
            }
        };
        fetchUserData();
    }, []);

    const toggleType = (label) => {
        setTypes(prev =>
            prev.includes(label)
                ? prev.filter(t => t !== label)
                : [...prev, label]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Rating Required',
                text: 'Please provide a rating!',
                confirmButtonColor: '#1a4d8c'
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const feedbackData = {
                rating,
                types,
                description,
                userName: name,
                userEmail: email,
                uid: auth.currentUser?.uid || 'anonymous'
            };

            await submitFeedback(feedbackData);
            setSubmitted(true);

            // Reset form
            setRating(0);
            setTypes([]);
            setDescription('');
        } catch (error) {
            console.error("Error submitting feedback:", error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: 'Failed to submit feedback. Please try again.',
                confirmButtonColor: '#1a4d8c'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="feedback-page">
                <Header />
                <div className="feedback-container">
                    <div className="feedback-card text-center py-5">
                        <div className="mb-4">
                            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                <Check size={40} />
                            </div>
                        </div>
                        <h2 className="text-primary mb-3">Thank You!</h2>
                        <p className="text-muted mb-4">Your feedback has been submitted successfully. We appreciate your help in improving the system.</p>
                        <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: '250px' }}>
                            <button className="submit-btn m-0" onClick={() => setSubmitted(false)}>Submit Another</button>
                            <button className="btn btn-outline-primary py-2 fw-bold" onClick={() => window.location.hash = '#/home'}>Go Back Home</button>
                        </div>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="feedback-page">
            <Header />
            <div className="feedback-container">
                <div className="feedback-card">
                    <div className="feedback-header">
                        <h2>Submit your feedback</h2>
                    </div>

                    <p className="feedback-subtitle">
                        Help us improve our project ! please share your thoughts, report bugs, or share new features
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="feedback-grid">
                            {/* Star Rating */}
                            <div className="rating-section">
                                <label>Give us rating <span className="required-star">*</span></label>
                                <div className="stars-container">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={32}
                                            className={`star-icon ${(hover || rating) >= star ? 'active' : ''}`}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            fill={(hover || rating) >= star ? "currentColor" : "none"}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Feedback Type */}
                            <div className="type-section">
                                <label>What type of feedback is this ?</label>
                                <div className="type-grid">
                                    {feedbackOptions.map((opt) => (
                                        <div
                                            key={opt.id}
                                            className={`type-item ${types.includes(opt.label) ? 'active' : ''}`}
                                            onClick={() => toggleType(opt.label)}
                                        >
                                            <div className="custom-checkbox">
                                                {types.includes(opt.label) && <Check size={14} />}
                                            </div>
                                            <span>{opt.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="description-section">
                            <label>Description of the issue <span className="required-star">*</span></label>
                            <textarea
                                className="description-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Tell us more about your experience..."
                                required
                            />
                        </div>

                        {/* Footer (Attachments, Name, Email) */}
                        <div className="footer-grid">
                            <div className="footer-field">
                                <label>Attachments</label>
                                <label className="upload-btn">
                                    <span>Upload Screenshot/file</span>
                                    <Upload size={18} />
                                    <input type="file" hidden />
                                </label>
                            </div>

                            <div className="footer-field">
                                <label>Your Name <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    className="footer-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="footer-field">
                                <label>Email <span className="required-star">*</span></label>
                                <input
                                    type="email"
                                    className="footer-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="submit-section">
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

export default Feedback;
