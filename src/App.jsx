import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SplashPage from "./pages/SplashPage";
import BillionEye from "./pages/BillionEye";
import RegisterPage from "./pages/userRegistration";
import LoginPage from "./pages/userLogin";

import ServiceLogin from "./pages/serviceLogin";
import CameraPage from "./pages/CameraPage";
import Dashboard from "./pages/Dashboard";
import BillionEyePublic from "./pages/BillionEyePublic";
import OnBoardingStaff from "./pages/OnBoardingStaff";
import EventReport from "./Agency/EventReport";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import GoMapsTest from "./pages/gomaps";
import AgencyLogin from "./Agency/AgencyLogin";
import OngoingTax from "./Agency/OngoingTax";
import AssignGroundStaff from "./Agency/assignGroundstaff";
import ForgotPassword from "./Agency/ForgetPassword";
import AdminAgencyManager from "./pages/AdminAgencyManager";

// Protected Route Component
const ProtectedRoute = ({ element: Element }) => {
  const isAuthenticated = !!localStorage.getItem("token");

  return isAuthenticated ? (
    <Element />
  ) : (
    <Navigate to="/agencyLogin" replace />
  );
};

function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        {/* Splash Page - Displays first for 3 seconds */}
        <Route path="/" element={<SplashPage />} />
        
        {/* Public Routes */}
        <Route path="/Agency" element={<BillionEye />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<BillionEyePublic />} />
        <Route path="/Camera" element={<CameraPage />} />
        <Route path="/onBoardingStaff" element={<ProtectedRoute element={OnBoardingStaff} />} />
        <Route path="/eventReport/:event_id"  element={<ProtectedRoute element={EventReport} />} />
        <Route path="/gomaps" element={<GoMapsTest />} />
        <Route path="/agencyLogin" element={<AgencyLogin />} />
        {/* <Route path="/agencyRegister" element={<AgencyRegister />} /> */}
        <Route path="/ongoingTax" element={<OngoingTax />} />
        <Route
          path="/dashboard/:agencyId"
          element={<Dashboard />}
        />
        <Route path="/assignGroundstaff" element={<ProtectedRoute element={AssignGroundStaff} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin" element={<AdminAgencyManager/>} />

        {/* Protected Routes */}

        <Route
          path="/ServiceLogin"
          element={<ProtectedRoute element={ServiceLogin} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
