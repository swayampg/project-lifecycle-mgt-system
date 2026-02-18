import React from 'react';
import { Plus } from 'lucide-react';
import './CreateProject.css';
import Header from './Header';
import BottomNav from './BottomNav';

const CreateProject = () => {
  return (
    <div className="dashboard-wrapper">
      <Header />

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
                    <button type="button" className="icon-add"><Plus size={16} /></button>
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

      <BottomNav />
    </div>
  );
};

export default CreateProject;