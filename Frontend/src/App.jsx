import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './Components/Layout';
import Home from './Pages/Home';
import PublicEvent from './Pages/PublicEvent';
import About from './Pages/About/About';
import Contact from './Pages/Contact';
import LoginSignup from './Pages/LoginSignup';
import UserDashboard from './Pages/Landing/UserDashboard';
import Userprofile from './Pages/Userprofile';
import Usersettings from './Pages/UserSettings';
import PrivateRoute from './Components/PrivateRoute';
import Dashboard from './Components/Dashboard'; 
import { organizerDashboardConfig, adminDashboardConfig } from './config/dashboardConfig';  // Add this import
import BookingForm from './Components/Bookingform';
import BookingSuccess from './Components/BookingSuccess';
import BookingFailure from './Components/BookingFailure';


const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/event" element={<PublicEvent />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/loginsignup" element={<LoginSignup />} />
          <Route path="/profile" element={<Userprofile />} />
          <Route path="/settings" element={<Usersettings />} />
            
           {/* booking routes */}
          
            <Route path ='/Booking-form'element={<BookingForm />} />
            <Route path="/Booking-success" element={<BookingSuccess />} />
            <Route path="/Booking-failure" element={<BookingFailure />} />
          

          {/* Protected Routes */}
          <Route 
            path="/admindb/:tab?" 
            element={
              <PrivateRoute 
                element={() => <Dashboard config={adminDashboardConfig} />} 
                requiredRole="Admin" 
              />
            } 
          />
          <Route 
            path="/orgdb/:tab?" 
            element={
              <PrivateRoute 
                element={() => <Dashboard config={organizerDashboardConfig} />} 
                requiredRole="Organizer" 
              />
            } 
          />
          <Route 
            path="/userdb" 
            element={<PrivateRoute element={UserDashboard} requiredRole="User" />} 
          />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;