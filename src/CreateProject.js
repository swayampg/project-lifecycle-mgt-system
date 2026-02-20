import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import './CreateProject.css';
import Header from './Header';
import BottomNav from './BottomNav';
import { db, auth } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic date validation
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      alert('End date cannot be before start date');
      return;
    }

    console.log('Project Data to be passed to DB:', formData);

    const saveProject = async () => {
      try {
        const proj_id = Date.now().toString();
        await addDoc(collection(db, "projects"), {
          proj_id: proj_id,
          Name: formData.projectTitle,
          projectLeader: formData.projectLeader,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description,
          category: formData.category,
          department: formData.department,
          createdAt: new Date()
        });

        // 2. Add creator to ProjectMember collection
        const user = auth.currentUser;
        if (user) {
          const project_member_id = `pm_${Date.now()}`;
          await addDoc(collection(db, "ProjectMember"), {
            project_member_id: project_member_id,
            role: "Project Leader",
            user_id: user.uid,
            project_id: proj_id
          });
        }

        alert('Project created successfully!');
        navigate('/Home');
      } catch (error) {
        console.error("Error adding document: ", error);
        alert('Error creating project. Please try again.');
      }
    };

    saveProject();
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
                <label>Project Leader<span className="required-star">*</span></label>
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

                <button type="submit" className="btn-create">Create Project</button>
              </div>

              {/* Team panel is visually floated on the right */}
              <div className="col-right col-md-4">
                <div className="team-card">
                  <div className="team-header">
                    <span>Team Members</span>
                    <button type="button" className="icon-add"><Plus size={16} /></button>
                  </div>
                  <div className="team-list">
                    <div className="text-muted small p-3 text-center">
                      No members added yet.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateProject;
