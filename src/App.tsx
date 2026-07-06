/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TradingProvider } from './context/TradingContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import History from './pages/History';
import Deposit from './pages/Deposit';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Layout
import SidebarLayout from './components/SidebarLayout';

// Loading Screen
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, emailVerifiedOverride, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isVerified = currentUser.emailVerified || emailVerifiedOverride;
  if (!isVerified) {
    return <Navigate to="/email-verification" replace />;
  }

  return <SidebarLayout>{children}</SidebarLayout>;
}

// Custom route for verification page
function VerificationRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, emailVerifiedOverride, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isVerified = currentUser.emailVerified || emailVerifiedOverride;
  if (isVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Main App Component Router Setup
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TradingProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Email Verification Required Route */}
            <Route
              path="/email-verification"
              element={
                <VerificationRoute>
                  <EmailVerification />
                </VerificationRoute>
              }
            />

            {/* Protected Trading Sandboxes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <ProtectedRoute>
                  <Trading />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TradingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
