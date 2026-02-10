import React from 'react';
import { Search, Bell, Settings, Plus, Home as HomeIcon, Layers, Activity, Grid } from 'lucide-react';
import './CreateProject.css';

const CreateProject = () => {
  return (
    <div className="dashboard-wrapper">
      <header className="top-nav d-flex justify-content-between align-items-center">
                      <div className="profile-section d-flex align-items-center">
                          <img src="https://via.placeholder.com/150" alt="Profile" className="me-2" />
                          <div>
                              <div className="fw-bold small">Swayam Pagui</div>
                              <div className="small opacity-75">Member</div>
                          </div>
                      </div>
      
                      <div className="d-flex align-items-center gap-3">
                          <div className="input-group">
                              <span className="input-group-text bg-white border-end-0"><Search size={18} /></span>
                              <input type="text" className="form-control border-start-0" placeholder="Search" />
                          </div>
                          <Bell className="cursor-pointer" />
                          <Settings className="cursor-pointer" />
                      </div>
                  </header>

      <main className="form-container">
        <div className="create-card relative-card">
          <form className="project-form">
            {/* Top Row: Title, Leader, Start, End */}
            <div className="form-row row-top d-flex gap-3">
              <div className="field col">
                <label>Project Title</label>
                <input type="text" className="custom-input" placeholder="Enter title" />
              </div>
              <div className="field col">
                <label>Project Leader</label>
                <input type="text" className="custom-input" placeholder="Leader name" />
              </div>
              <div className="field col narrow">
                <label>Start Date</label>
                <input type="date" className="custom-input" />
              </div>
              <div className="field col narrow">
                <label>End Date</label>
                <input type="date" className="custom-input" />
              </div>
            </div>

            {/* Description */}
            <div className="form-group mt-3">
              <label>Project Description</label>
              <textarea className="custom-input textarea" placeholder="Describe the project..."></textarea>
            </div>

            {/* Category / Department (left) */}
            <div className="form-row mt-3 align-items-start d-flex">
              <div className="col-left col-md-8">
                <div className="form-group inline-fields d-flex gap-3">
                  <div className="field half">
                    <label>Project Category</label>
                    <select className="custom-input">
                      <option>Select category</option>
                    </select>
                  </div>
                  <div className="field half">
                    <label>Department</label>
                    <select className="custom-input">
                      <option>Select department</option>
                    </select>
                  </div>
                </div>

                <button type="button" className="btn-create">Create</button>
              </div>

              {/* Team panel is visually floated on the right */}
              <div className="col-right col-md-4">
                <div className="team-card">
                  <div className="team-header">
                    <span>Team Members</span>
                    <button className="icon-add"><Plus size={16} /></button>
                  </div>
                  <div className="team-list">
                    {[1, 2, 3, 4].map((member) => (
                      <div key={member} className="member-item">
                        <img src="https://via.placeholder.com/40" alt="member" />
                        <div>
                          <div className="m-name">Swayam</div>
                          <div className="m-role">Member</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item active"><HomeIcon size={20} /></button>
        <button className="nav-item"><Layers size={20} /></button>
        <button className="nav-item"><Activity size={20} /></button>
        <button className="nav-item"><Grid size={20} /></button>
      </nav>
    </div>
  );
};

export default CreateProject;