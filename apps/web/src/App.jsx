import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ResultPage from '@/pages/ResultPage';
import PricingPage from '@/pages/PricingPage';
import ChatPage from '@/pages/ChatPage';
import SuccessPage from '@/pages/SuccessPage';
import CancelPage from '@/pages/CancelPage';
import LandingPage from '@/pages/LandingPage';
import SettingsPage from '@/pages/SettingsPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import PublicPage from '@/pages/PublicPage';
import LeadsPage from '@/pages/LeadsPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/landing" replace />;
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <>
      {currentUser && <EmailVerificationBanner />}
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/result" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/p/:id" element={<PublicPage />} />
        <Route path="/leads/:pageId" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/analytics/:pageId" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
