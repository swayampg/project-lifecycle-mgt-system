import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import ResetPassword from './ResetPassword';
import Home from './Home';
import CreateProject from './CreateProject';
import ProjectBoard from './ProjectBoard';
import Progress from './Progress';
import Profile from './Profile';
import Mytask from './Mytask';
import ProfileOverview from './ProfileOverview';
import Notifications from './Notifications';
import MentorDashboard from './mentorDashboard';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/CreateProject" element={<CreateProject />} />
        <Route path="/project-board" element={<ProjectBoard />} />
        <Route path="/Progress" element={<Progress />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/Mytask" element={<Mytask />} />
        <Route path="/profile-overview" element={<ProfileOverview />} />
        <Route path="/Notifications" element={<Notifications />} />
        <Route path="/mentorDashboard" element={<MentorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;