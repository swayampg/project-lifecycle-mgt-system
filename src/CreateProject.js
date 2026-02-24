import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2'; // Import SweetAlert2
import './CreateProject.css';
import Header from './Header';
import BottomNav from './BottomNav';
import { auth, db } from './firebaseConfig';
import { createProjectWithTeam, findUserByEmail, sendInvitation } from './services/db_services';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const CreateProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectLeader: '',
    startDate: '',
    endDate: '',
    description: '',
    category: '',
    department: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invitationData, setInvitationData] = useState({ email: '', role: 'Member' });
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // NEW: State for the Create Project button
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Auto-add creator on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setInvitedMembers([{
              uid: user.uid,
              fullName: userData.fullName || "You",
              email: user.email,
              role: 'Leader',
              isCreator: true
            }]);
            // Auto-fill project leader name
            setFormData(prev => ({ ...prev, projectLeader: userData.fullName || "" }));
          }
        } catch (error) {
          console.error("Error fetching creator data:", error);
        }
      } else {
        navigate('/Login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddMember = async () => {
    if (!invitationData.email) return;

    // Validation: Only one Leader and one Mentor
    if (invitationData.role === 'Leader' || invitationData.role === 'Mentor') {
      const alreadyExists = invitedMembers.some(m => m.role === invitationData.role);
      if (alreadyExists) {
        Swal.fire({
          icon: 'warning',
          title: 'Limit Reached',
          text: `A project can only have one ${invitationData.role}.`,
        });
        return;
      }
    }

    setIsSearching(true);
    try {
      const user = await findUserByEmail(invitationData.email);
      if (user) {
        if (invitedMembers.some(m => m.uid === user.uid)) {
          Swal.fire({
            icon: 'info',
            text: "User is already in the team list.",
          });
          return;
        }

        setInvitedMembers([...invitedMembers, { ...user, role: invitationData.role }]);
        setInvitationData({ email: '', role: 'Member' });
        setIsModalOpen(false);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'User Not Found',
          text: "No user found with this email. Only registered users can be invited.",
        });
      }
    } catch (error) {
      console.error("Error searching user:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const removeMember = (uid) => {
    setInvitedMembers(invitedMembers.filter(m => m.uid !== uid));
  };

  const updateMemberRole = (uid, newRole) => {
    // Validation: Only one Leader and one Mentor
    if (newRole === 'Leader' || newRole === 'Mentor') {
      const alreadyExists = invitedMembers.some(m => m.role === newRole && m.uid !== uid);
      if (alreadyExists) {
        Swal.fire({
          icon: 'warning',
          text: `A project can only have one ${newRole}.`,
        });
        return;
      }
    }
    setInvitedMembers(invitedMembers.map(m => m.uid === uid ? { ...m, role: newRole } : m));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      Swal.fire({
        icon: 'error',
        text: 'End date cannot be before start date',
      });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Swal.fire({
        icon: 'auth-error',
        text: "You must be logged in to create a project.",
      });
      return;
    }

    setIsCreating(true); // NEW: Swap text and disable button immediately

    try {
      // Find the creator's role from the list
      const creator = invitedMembers.find(m => m.isCreator);
      const creatorRole = creator ? creator.role : "Leader";

      // 1. Create project (returns proj_id)
      const proj_id = await createProjectWithTeam(formData, user.uid, creatorRole);

      // 2. Send invitations for all members (EXCEPT the creator who is already in projectTeam)
      const otherMembers = invitedMembers.filter(m => !m.isCreator);
      for (const member of otherMembers) {
        await sendInvitation({ proj_id, Name: formData.projectTitle, projectLeader: formData.projectLeader }, member, member.role);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Project Created Successfully!!',
        text: 'Project created and invitations sent!',
        timer: 2000,
        showConfirmButton: false
      });
      navigate('/Home');
    } catch (error) {
      console.error("Error creating project: ", error);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: 'Error creating project. Please try again.',
      });
      setIsCreating(false); // NEW: Re-enable button if there's an error so they can try again
    }
  };

  return (
    <div className="dashboard-wrapper">
      <Header />

      <main className="form-container">
        <div className="create-card relative-card">
          <form className="project-form" onSubmit={handleSubmit}>
            {/* Top Row: Title, Leader, Start, End */}
            <div className="form-row row-top d-flex gap-3">
              <div className="field col">
                <label>Project Title<span className="required-star">*</span></label>
                <input
                  type="text"
                  name="projectTitle"
                  className="custom-input"
                  placeholder="Enter title"
                  value={formData.projectTitle}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field col">
                <label>Project Leader Name<span className="required-star">*</span></label>
                <input
                  type="text"
                  name="projectLeader"
                  className="custom-input"
                  placeholder="Leader name"
                  value={formData.projectLeader}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field col narrow">
                <label>Start Date<span className="required-star">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  className="custom-input"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field col narrow">
                <label>End Date<span className="required-star">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  className="custom-input"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group mt-3">
              <label>Project Description<span className="required-star">*</span></label>
              <textarea
                name="description"
                className="custom-input textarea"
                placeholder="Describe the project..."
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            {/* Category / Department (left) */}
            <div className="form-row mt-3 align-items-start d-flex">
              <div className="col-left col-md-8">
                <div className="form-group inline-fields d-flex gap-3">
                  <div className="field half">
                    <label>Project Category<span className="required-star">*</span></label>
                    <select
                      name="category"
                      className="custom-input"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="IOT">IOT</option>
                    </select>
                  </div>
                  <div className="field half">
                    <label>Department<span className="required-star">*</span></label>
                    <select
                      name="department"
                      className="custom-input"
                      value={formData.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select department</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electrical and Electronic Engineering">Electrical and Electronic Engineering</option>
                    </select>
                  </div>
                </div>

                {/* MODIFIED: Button now swaps text and shows a loading state */}
                <button type="submit" className="btn-create" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <span className="spinner-border-custom"></span> Creating Project...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>

              {/* Team panel */}
              <div className="col-right col-md-4">
                <div className="team-card">
                  <div className="team-header">
                    <span>Team Members</span>
                    <button
                      type="button"
                      className="icon-add"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="team-list">
                    {invitedMembers.length > 0 ? (
                      invitedMembers.map((m) => (
                        <div key={m.uid} className="member-item p-2 border-bottom d-flex flex-column gap-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small fw-bold text-truncate" style={{ maxWidth: '120px' }} title={m.fullName}>
                              {m.fullName} {m.isCreator && "(You)"}
                            </span>
                            <div className="d-flex gap-2">
                              <select
                                className="form-select form-select-sm border-0 bg-transparent p-0 text-muted"
                                style={{ fontSize: '0.75rem', width: 'auto' }}
                                value={m.role}
                                onChange={(e) => updateMemberRole(m.uid, e.target.value)}
                              >
                                <option value="Member">Member</option>
                                <option value="Leader">Leader</option>
                                <option value="Mentor">Mentor</option>
                              </select>
                              {!m.isCreator && (
                                <button
                                  type="button"
                                  className="btn-delete-member border-0 bg-transparent p-0 text-danger"
                                  onClick={() => removeMember(m.uid)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted small p-3 text-center">
                        Loading your profile...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-custom">
            <div className="modal-header-custom d-flex justify-content-between border-bottom pb-3">
              <h5 className="m-0">Add Member</h5>
              <button className="btn-close-custom bg-transparent border-0" onClick={() => setIsModalOpen(false)}>
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
                {isSearching ? "Searching..." : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CreateProject;