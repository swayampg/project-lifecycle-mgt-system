import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup'; // 🔹 Import the new Signup page
import ResetPassword from './ResetPassword'; // 🔹 Import Reset Password page
import Home from './Home';
import CreateProject from './CreateProject';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* This is the starting page (Login) */}
        <Route path="/" element={<Login />} />

        {/* This is the Signup page */}
        <Route path="/signup" element={<Signup />} />

        {/* This is the Reset Password page */}
        <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/home" element={<Home />} />

        <Route path="/" element={<CreateProject />} />

        

        {/* Placeholder for your Dashboard. 
            Once you create Dashboard.js, you can uncomment the line below.
        */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}

      </Routes>
    </Router>
  );
}

export default App;