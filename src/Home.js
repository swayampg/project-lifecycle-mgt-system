import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
    getUserProjects,
    deleteProject,
    findUserByEmail,
    sendInvitation,
    getExistingInvitationsByProject,
    getProjectTeamMembers,
    requestProjectDeletion,
    cancelProjectDeletion,
    updateMemberConsent
} from './services/db_services';
import './Home.css';
import { Plus, Folder, CheckSquare, Trash2, UserPlus, Search, X, Check, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import BottomNav from './BottomNav';
import Header from './Header';

const Home = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('selectedProjectId') || null);

    // Invitation Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [projectForInvite, setProjectForInvite] = useState(null);
    const [invitationData, setInvitationData] = useState({ email: '', role: 'Member' });
    const [isSearching, setIsSearching] = useState(false);


    const fetchData = async (user) => {
        if (!user) return;
        setLoading(true);
        try {
            const projs = await getUserProjects(user.uid);
            setProjects(projs);
        } catch (error) {
            console.error("Error fetching home data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Clear selected project when visiting Home
        localStorage.removeItem('selectedProjectId');
        setSelectedProjectId(null);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (user) {
                fetchData(user);
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleDeleteProject = async (e, project) => {
        e.stopPropagation();

        // If already pending, handle final deletion or status view
        if (project.deletionStatus === 'pending') {
            const team = await getProjectTeamMembers(project.proj_id);
            const consents = team.filter(m => m.consentToDelete).length;
            const total = team.length;

            if (consents === total) {
                const finalResult = await Swal.fire({
                    title: 'Finalize Deletion?',
                    text: "All members have consented. Permanent deletion cannot be undone.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Delete Permanently'
                });
                if (finalResult.isConfirmed) {
                    await deleteProject(project.proj_id);
                    Swal.fire('Deleted!', 'Project removed.', 'success');
                    fetchData(currentUser);
                }
            } else {
                Swal.fire({
                    title: 'Deletion Pending',
                    text: `Waiting for member consent. (${consents}/${total} confirmed)`,
                    icon: 'info',
                    showCancelButton: true,
                    cancelButtonText: 'Close',
                    confirmButtonText: 'Cancel Request',
                    confirmButtonColor: '#6c757d'
                }).then(async (res) => {
                    if (res.isConfirmed) {
                        await cancelProjectDeletion(project.proj_id);
                        Swal.fire('Cancelled', 'Deletion request removed.', 'info');
                        fetchData(currentUser);
                    }
                });
            }
            return;
        }

        const result = await Swal.fire({
            title: 'Request Project Deletion?',
            text: `You are requesting to delete "${project.Name}". All project members must consent before it can be deleted.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Send Request'
        });

        if (result.isConfirmed) {
            try {
                await requestProjectDeletion(project.proj_id);
                // The leader should auto-consent
                await updateMemberConsent(project.proj_id, currentUser.uid, true);
                Swal.fire('Request Sent!', 'Members will see a consent prompt on their dashboard.', 'success');
                fetchData(currentUser);
            } catch (error) {
                Swal.fire('Error', 'Failed to initiate deletion request.', 'error');
            }
        }
    };

    const handleConsent = async (e, project, consent) => {
        e.stopPropagation();
        try {
            await updateMemberConsent(project.proj_id, currentUser.uid, consent);
            if (!consent) {
                await cancelProjectDeletion(project.proj_id);
                Swal.fire('Rejected', 'Deletion request has been cancelled.', 'info');
            } else {
                Swal.fire('Consented', 'Your preference has been recorded.', 'success');
            }
            fetchData(currentUser);
        } catch (error) {
            Swal.fire('Error', 'Failed to update consent.', 'error');
        }
    };

    const openInviteModal = (e, project) => {
        e.stopPropagation();
        setProjectForInvite(project);
        setIsInviteModalOpen(true);
    };

    const handleAddMember = async () => {
        if (!invitationData.email || !projectForInvite) return;

        setIsSearching(true);
        try {
            // 1. Find user
            const user = await findUserByEmail(invitationData.email);
            if (!user) {
                Swal.fire({ icon: 'error', title: 'User Not Found', text: "No user found with this email." });
                return;
            }

            // 2. Check if already in team
            const team = await getProjectTeamMembers(projectForInvite.proj_id);
            if (team.some(m => m.uid === user.uid)) {
                Swal.fire({ icon: 'info', text: "User is already a member of this project." });
                return;
            }

            // 3. Check for existing invitation
            const existingInvites = await getExistingInvitationsByProject(projectForInvite.proj_id, user.uid);
            if (existingInvites.length > 0) {
                Swal.fire({ icon: 'info', text: "An invitation is already pending for this user." });
                return;
            }

            // 4. Send invitation
            await sendInvitation(
                { proj_id: projectForInvite.proj_id, Name: projectForInvite.Name, projectLeader: projectForInvite.projectLeader },
                user,
                invitationData.role
            );

            Swal.fire({ icon: 'success', title: 'Invitation Sent!', timer: 1500, showConfirmButton: false });
            setInvitationData({ email: '', role: 'Member' });
            setIsInviteModalOpen(false);
        } catch (error) {
            console.error("Error inviting member:", error);
            Swal.fire({ icon: 'error', title: 'Error', text: "Failed to send invitation." });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Header />

            <div className="container mt-4">
                {/* --- STAT CARDS SECTION --- */}

                {/* --- STAT CARDS SECTION --- */}
                <div className="row g-4">
                    <div className="col-md-4">
                        <div
                            className="stat-card p-3 d-flex align-items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/CreateProject')}
                        >
                            <div className="icon-box bg-primary">
                                <Plus color="white" />
                            </div>
                            <span className="fw-bold">Create New Project</span>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-dark">
                                <Folder color="white" />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Total Projects</div>
                                <div className="h5 mb-0">{projects.length}</div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="stat-card p-3 d-flex align-items-center gap-3">
                            <div className="icon-box bg-primary">
                                <CheckSquare color="white" />
                            </div>
                            <div>
                                <div className="small text-muted fw-bold">Your Tasks</div>
                                <div className="h5 mb-0">0</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN DISPLAY AREA --- */}
                <div className="project-area mt-4">
                    <h5 className="mb-4">Your Projects</h5>
                    {loading ? (
                        <div className="text-center p-5 text-muted">Loading projects...</div>
                    ) : projects.length > 0 ? (
                        <div className="row g-4">
                            {projects.map((project) => (
                                <div key={project.id} className="col-12">
                                    <div
                                        className={`project-item-card p-3 shadow-sm border rounded-3 bg-white cursor-pointer d-flex justify-content-between align-items-center ${selectedProjectId === project.proj_id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedProjectId(project.proj_id);
                                            localStorage.setItem('selectedProjectId', project.proj_id);
                                            navigate('/project-board');
                                        }}
                                    >
                                        <div className="project-info-left" style={{ flex: '1' }}>
                                            <h6 className="project-name mb-0 text-primary">{project.Name}</h6>
                                            <span className="badge bg-light text-dark small">{project.category}</span>
                                        </div>

                                        <div className="project-info-middle text-center" style={{ flex: '1' }}>
                                            <div className="text-muted small">
                                                <strong>{project.userRole}:</strong> {currentUser?.displayName}
                                            </div>
                                            {project.deletionStatus === 'pending' && (
                                                <div className="mt-1">
                                                    <span className="badge bg-warning text-dark animate-pulse">
                                                        <AlertCircle size={10} className="me-1" />
                                                        Deletion Pending
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="project-info-right d-flex align-items-center justify-content-between" style={{ flex: '1' }}>
                                            <div className="d-flex flex-column small text-muted">
                                                <span><strong>Start:</strong> {project.startDate}</span>
                                                <span><strong>End:</strong> {project.endDate}</span>
                                            </div>
                                            <div className="project-actions d-flex gap-2">
                                                {project.deletionStatus === 'pending' && project.userRole !== 'Project Leader' && project.userRole !== 'Leader' ? (
                                                    <div className="d-flex gap-1 align-items-center">
                                                        <button
                                                            className={`btn btn-sm ${project.userConsent ? 'btn-success' : 'btn-outline-success'} action-btn-wide`}
                                                            onClick={(e) => handleConsent(e, project, true)}
                                                            title="Approve Deletion"
                                                        >
                                                            <Check size={14} className="me-1" /> {project.userConsent ? 'Approved' : 'Approve'}
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger action-btn"
                                                            onClick={(e) => handleConsent(e, project, false)}
                                                            title="Reject Deletion"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary action-btn"
                                                            title="Invite Members"
                                                            onClick={(e) => openInviteModal(e, project)}
                                                        >
                                                            <UserPlus size={16} />
                                                        </button>
                                                        {(project.userRole === 'Project Leader' || project.userRole === 'Leader') && (
                                                            <button
                                                                className={`btn btn-sm ${project.deletionStatus === 'pending' ? 'btn-warning' : 'btn-outline-danger'} action-btn`}
                                                                title={project.deletionStatus === 'pending' ? 'Check Consent Status' : 'Request Deletion'}
                                                                onClick={(e) => handleDeleteProject(e, project)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-5 border rounded bg-white text-muted">
                            <Folder size={40} className="mb-3 opacity-25" />
                            <p className="mb-0">No projects yet. Create one or wait for an invitation!</p>
                        </div>
                    )}
                </div>

                {/* Add Member Modal */}
                {isInviteModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content-custom">
                            <div className="modal-header-custom d-flex justify-content-between border-bottom pb-3">
                                <h5 className="m-0">Invite to {projectForInvite?.Name}</h5>
                                <button className="btn-close-custom bg-transparent border-0" onClick={() => setIsInviteModalOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body-custom py-4">
                                <div className="mb-3">
                                    <label className="form-label">Search Email</label>
                                    <div className="input-group">
                                        <span className="input-group-text"><Search size={14} /></span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Enter email address"
                                            value={invitationData.email}
                                            onChange={(e) => setInvitationData({ ...invitationData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Assign Role</label>
                                    <select
                                        className="form-select"
                                        value={invitationData.role}
                                        onChange={(e) => setInvitationData({ ...invitationData, role: e.target.value })}
                                    >
                                        <option value="Member">Member</option>
                                        <option value="Leader">Leader</option>
                                        <option value="Mentor">Mentor</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary w-100 py-2"
                                    onClick={handleAddMember}
                                    disabled={isSearching}
                                >
                                    {isSearching ? "Searching..." : "Send Invitation"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default Home;