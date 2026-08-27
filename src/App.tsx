/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
} from './context/AuthContext';

import { TradingProvider } from './context/TradingContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import History from './pages/History';
import Deposit from './pages/Deposit';
import Withdrawal from './pages/Withdrawal';
import Profile from './pages/Profile';
import KYC from './pages/KYC';
import Contact from './pages/Contact';
import Complaints from './pages/Complaints';
import EconomicCalendar from './pages/EconomicCalendar';
import TradingChartPopout from './pages/TradingChartPopout';
import Admin from './pages/Admin';

// Layout
import SidebarLayout from './components/SidebarLayout';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    currentUser,
    emailVerifiedOverride,
    loading,
  } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isVerified =
    currentUser.emailVerified ||
    emailVerifiedOverride;

  if (!isVerified) {
    return (
      <Navigate
        to="/email-verification"
        replace
      />
    );
  }

  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}

function VerificationRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    currentUser,
    emailVerifiedOverride,
    loading,
  } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isVerified =
    currentUser.emailVerified ||
    emailVerifiedOverride;

  if (isVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TradingProvider>
          <Routes>
            {/* Public */}
            <Route path="/home" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={<Login />}
            />
            <Route
              path="/register"
              element={<Register />}
            />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />
            <Route
              path="/email-verification"
              element={
                <VerificationRoute>
                  <EmailVerification />
                </VerificationRoute>
              }
            />

            {/* Protected */}
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
              path="/withdrawal"
              element={
                <ProtectedRoute>
                  <Withdrawal />
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
              path="/kyc"
              element={
                <ProtectedRoute>
                  <KYC />
                </ProtectedRoute>
              }
            />

            <Route
              path="/trade/chart"
              element={
                <ProtectedRoute>
                  <TradingChartPopout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <EconomicCalendar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <Complaints />
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

            <Route
              path="*"
              element={
                <Navigate
                  to="/home"
                  replace
                />
              }
            />
          </Routes>
        </TradingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}