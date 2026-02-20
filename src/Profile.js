import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Edit2, X, User } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import './Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchUserData = async (uid) => {
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
                setEditData(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                fullName: editData.fullName,
                department: editData.department || '',
                enrollmentNo: editData.enrollmentNo || '',
            });
            setUserData(editData);
            setIsEditModalOpen(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        }
    };

    if (loading) {
        return (
            <div className="profile-container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!userData) {
        return <div className="p-5 text-center">Please login to view profile.</div>;
    }

    return (
        <div className="profile-wrapper">
            <Header />

            <main className="profile-main py-4">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="section-title">View Profile</h2>
                        <button
                            className="btn btn-primary edit-profile-btn d-flex align-items-center gap-2"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="profile-card shadow-sm border-0 rounded-4 p-5 animate-fade-in">
                        <div className="row align-items-center">
                            {/* Left Side: Avatar & Basic Info */}
                            <div className="col-md-5 text-center border-end-md">
                                <div className="avatar-placeholder mb-3">
                                    <User size={80} color="white" />
                                </div>
                                <h3 className="user-name mb-1">{userData.fullName}</h3>
                            </div>

                            {/* Right Side: Detailed Details */}
                            <div className="col-md-7 ps-md-5">
                                <div className="detail-item mb-4">
                                    <label>Joined :</label>
                                    <p>{userData.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
                                    <hr />
                                </div>

                                <div className="detail-item mb-4">
                                    <label>Department</label>
                                    <p>{userData.department || 'Not specified'}</p>
                                    <hr />
                                </div>

                                <div className="detail-item mb-4">
                                    <label>Enrollment No:</label>
                                    <p>{userData.enrollmentNo || 'Not specified'}</p>
                                    <hr />
                                </div>

                                <div className="detail-item mb-0">
                                    <label>Contact Information</label>
                                    <p>Email: {userData.email}</p>
                                    <hr />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="edit-modal-content">
                        <div className="modal-header d-flex justify-content-between align-items-center border-bottom pb-3">
                            <h5 className="mb-0">Edit Profile</h5>
                            <button className="btn-close-custom" onClick={() => setIsEditModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-4">
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary">Full Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editData.fullName}
                                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-secondary">Department</label>
                                <select
                                    className="form-select"
                                    value={editData.department || ''}
                                    onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                >
                                    <option value="">Select department</option>
                                    <option value="Computer Engineering">Computer Engineering</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary">Enrollment No</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editData.enrollmentNo || ''}
                                    onChange={(e) => setEditData({ ...editData, enrollmentNo: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
};

export default Profile;
