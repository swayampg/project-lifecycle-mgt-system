import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import './ProfileOverview.css';

const ProfileOverview = () => {
    return (
        <div className="profile-overview-container">
            <Header />

            <main className="profile-main-content d-flex justify-content-center align-items-center">
                <div className="profile-card shadow-sm">
                    <div className="profile-card-header d-flex align-items-center mb-4">
                        <img
                            src="https://via.placeholder.com/150"
                            alt="Profile"
                            className="profile-card-img me-3"
                        />
                        <div className="profile-card-info">
                            <h5 className="mb-0 fw-bold">Swayam Pagui</h5>
                            <p className="text-muted mb-0 small">Swayam.pagui@gmail.com</p>
                        </div>
                    </div>

                    <div className="profile-options">
                        <button className="profile-option-btn d-block w-100 text-start py-3">
                            View Profile
                        </button>
                        <button className="profile-option-btn d-block w-100 text-start py-3">
                            Help
                        </button>
                        <button className="profile-option-btn logout-btn d-block w-100 text-start py-3 border-0">
                            Log Out
                        </button>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
};

export default ProfileOverview;
