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
import Reviewtask from './Reviewtask';
import Feedback from './Feedback';
import CompletedProjects from './CompletedProjects';
import GlobalGlobeNav from './GlobalGlobeNav';
import ProtectedRoute from './components/ProtectedRoute';


import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/CreateProject" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
        <Route path="/project-board" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
        <Route path="/Progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/Mytask" element={<ProtectedRoute><Mytask /></ProtectedRoute>} />
        <Route path="/profile-overview" element={<ProtectedRoute><ProfileOverview /></ProtectedRoute>} />
        <Route path="/Notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/mentorDashboard" element={<ProtectedRoute><MentorDashboard /></ProtectedRoute>} />
        <Route path="/Reviewtask" element={<ProtectedRoute><Reviewtask /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/completed-projects" element={<ProtectedRoute><CompletedProjects /></ProtectedRoute>} />

      </Routes>
      <GlobalGlobeNav />
    </Router>
  );
}

export default App;