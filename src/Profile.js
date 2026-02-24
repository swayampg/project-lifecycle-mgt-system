import React, { useState, useEffect } from 'react';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Edit2, X, User, Building, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2'; // Added SweetAlert2 import
import Header from './Header';
import BottomNav from './BottomNav';
import './Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false); // NEW: State for the update button loading

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
                const data = docSnap.data();
                const userEmail = auth.currentUser?.email || '';
                setUserData({ ...data, email: userEmail });
                setEditData({ ...data, email: userEmail });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                // Changed to SweetAlert2
                Swal.fire({
                    icon: 'warning',
                    title: 'File too large',
                    text: 'Image size should be less than 1MB',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditData({ ...editData, profilePicture: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        setIsUpdating(true); // NEW: Start loading swap

        try {
            const userRef = doc(db, "users", user.uid);
            const updatePayload = {
                fullName: editData.fullName,
                department: editData.department || '',
                enrollmentNo: editData.enrollmentNo || '',
            };

            if (editData.profilePicture) {
                updatePayload.profilePicture = editData.profilePicture;
            }

            await updateDoc(userRef, updatePayload);
            setUserData(editData);
            setIsEditModalOpen(false);
            
            // Changed to SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Profile updated successfully!',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error("Error updating profile:", error);
            
            // Changed to SweetAlert2
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to update profile.',
            });
        } finally {
            setIsUpdating(false); // NEW: Reset loading state
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
                    <div className="d-flex justify-content-between align-items-end mb-4 animate-fade-in">
                        <div>
                            <h2 className="section-title mb-0">View Profile</h2>
                            <p className="text-muted mb-0">Manage your personal information and preferences</p>
                        </div>
                        <button
                            className="btn btn-primary edit-profile-btn d-flex align-items-center gap-2"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Edit2 size={18} /> Edit Profile
                        </button>
                    </div>

                    <div className="profile-card horizontal-layout shadow-sm animate-fade-in mb-5">
                        <div className="row g-0 align-items-center">
                            {/* Left Side: Avatar & Name */}
                            <div className="col-md-5 text-center py-5 border-end-light">
                                <div className="avatar-placeholder large-avatar mb-3 mx-auto overflow-hidden">
                                    {userData.profilePicture ? (
                                        <img src={userData.profilePicture} alt="Profile" className="profile-img-main" />
                                    ) : (
                                        <User size={80} color="#878d9fff" strokeWidth={1.5} />
                                    )}
                                </div>
                                <h2 className="profile-user-name">{userData.fullName}</h2>
                            </div>

                            {/* Right Side: Detailed Details */}
                            <div className="col-md-7 p-4 p-md-5">
                                <div className="image-style-details">
                                    <div className="img-detail-item">
                                        <label>Joined :</label>
                                        <p>{userData.createdAt?.toDate
                                            ? userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                            : 'January 2026'}</p>
                                        <hr />
                                    </div>

                                    <div className="img-detail-item">
                                        <label>Department</label>
                                        <p>{userData.department || 'Computer Engineering'}</p>
                                        <hr />
                                    </div>

                                    <div className="img-detail-item">
                                        <label>Enrollment No:</label>
                                        <p>{userData.enrollmentNo || '240549333'}</p>
                                        <hr />
                                    </div>

                                    <div className="img-detail-item">
                                        <label>Contact Information</label>
                                        <p>Email: {userData.email || 'abc@gmai.com'}</p>
                                        <hr />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card-footer-line"></div>
                    </div>
                </div>
            </main>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="edit-modal-content animate-fade-in">
                        <div className="modal-header d-flex justify-content-between align-items-center">
                            <h5 className="modal-title mb-0">Edit Your Profile</h5>
                            <button className="btn-close-custom" onClick={() => setIsEditModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-4">
                            <div className="text-center mb-4">
                                <div className="avatar-upload-container mx-auto position-relative" style={{ width: '120px' }}>
                                    <div className="avatar-placeholder modal-avatar mx-auto overflow-hidden">
                                        {editData.profilePicture ? (
                                            <img src={editData.profilePicture} alt="Preview" className="profile-img-preview" />
                                        ) : (
                                            <User size={60} color="#878d9fff" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <label htmlFor="profile-upload" className="avatar-upload-label position-absolute bottom-0 end-0 cursor-pointer">
                                        <div className="upload-icon-circle bg-primary text-white p-2 rounded-circle shadow-sm">
                                            <Edit2 size={16} />
                                        </div>
                                    </label>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <p className="small text-muted mt-2">Click icon to change picture</p>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary">FULL NAME</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editData.fullName}
                                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary">DEPARTMENT</label>
                                <select
                                    className="form-select"
                                    value={editData.department || ''}
                                    onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                >
                                    <option value="">Select your department</option>
                                    <option value="Computer Engineering">Computer Engineering</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                                    <option value="Information Technology">Information Technology</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-secondary">ENROLLMENT NUMBER</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editData.enrollmentNo || ''}
                                    onChange={(e) => setEditData({ ...editData, enrollmentNo: e.target.value })}
                                    placeholder="Enter your enrollment number"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100 save-btn py-3 mt-2 d-flex align-items-center justify-content-center gap-2"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <span className="spinner-border-custom"></span> Updating Profile Details...
                                    </>
                                ) : (
                                    "Update Profile Details"
                                )}
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