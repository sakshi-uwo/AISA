import React, { useState } from 'react';
import { Routes, Route, Outlet, Navigate, BrowserRouter, useNavigate, useLocation, Link } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerificationForm from './pages/VerificationForm';
import Chat from './pages/Chat';
import Sidebar from './Components/SideBar/Sidebar.jsx';
import Profile from './pages/Profile';
import AiPersonalAssistantDashboard from './pages/AiPersonalAssistant/Dashboard';



import { AppRoute } from './types';
import { Menu } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { toggleState, getUserData } from './userStore/userData';

import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import PlatformSubscriptionModal from './Components/SubscriptionForm/PlatformSubscriptionModal.jsx';

import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute.jsx';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import UpgradeModal from './Components/Subscription/UpgradeModal.jsx';
import CookieConsentBanner from './Components/CookieConsentBanner.jsx';

// Vendor Imports Removed
// import VendorLayout from './Components/Vendor/VendorLayout';
// import VendorOverview from './pages/Vendor/VendorOverview';
// ...

const SecurityAndGuidelines = lazy(() => import('./pages/SecurityAndGuidelines'));

// ------------------------------
// Home Redirect Component
// ------------------------------
// Redirects logged-in users to chat on direct access,
// but allows them to view landing page when clicking logo from within app
const HomeRedirect = () => {
  const user = getUserData();
  const hasToken = user?.token;
  const location = useLocation();

  // Check if user came from clicking the logo (internal navigation)
  const isInternalNavigation = location.state?.fromLogo === true;

  // If user is logged in
  if (hasToken) {
    // Allow viewing landing page if they clicked the logo from within the app
    if (isInternalNavigation) {
      return <Landing />;
    }
    // Otherwise (direct URL access), redirect to chat
    return <Navigate to="/dashboard/chat" replace />;
  }

  // Non-authenticated users always see the landing page
  return <Landing />;
};

// ------------------------------
// Guest Route Component
// ------------------------------
// Protects login/signup pages - redirects authenticated users to chat
const GuestRoute = ({ children }) => {
  const user = getUserData();
  const hasToken = user?.token;

  // If user is already logged in, redirect to chat
  if (hasToken) {
    return <Navigate to="/dashboard/chat" replace />;
  }

  // Otherwise, allow access to login/signup page
  return children;
};

const AuthenticatRoute = ({ children }) => {
  return children;
}

// ------------------------------
// Dashboard Layout (Auth pages)
// ------------------------------

const PlanExpiryBanner = () => {
  const { plan, planEndDate, setIsUpgradeModalOpen } = useSubscription();

  if (!planEndDate || !plan || plan.toLowerCase() === 'basic' || plan.toLowerCase() === 'free') return null;

  const endDate = new Date(planEndDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 3 && diffDays > 0) {
    return (
      <div className="bg-gradient-to-r from-red-500/90 to-orange-500/90 backdrop-blur-md text-white px-4 py-2.5 flex items-center justify-center sm:justify-between flex-wrap gap-2 text-sm shadow-md z-50 shrink-0 border-b border-red-400/30">
        <div className="flex items-center gap-2">
          <span className="animate-pulse">🔥</span>
          <span className="font-medium text-center">
            Your <strong>{plan.toUpperCase()}</strong> plan expires in <strong>{diffDays} day{diffDays !== 1 ? 's' : ''}</strong>!
          </span>
        </div>
        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 transition-transform active:scale-95 shadow-sm"
        >
          Renew Now
        </button>
      </div>
    );
  } else if (diffDays <= 0) {
    return (
      <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-2.5 flex items-center justify-center sm:justify-between flex-wrap gap-2 text-sm shadow-md z-50 shrink-0 border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span className="font-medium text-center">
            Your <strong>{plan.toUpperCase()}</strong> plan has expired.
          </span>
        </div>
        <button
          onClick={() => setIsUpgradeModalOpen(true)}
          className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 transition-transform active:scale-95 shadow-sm"
        >
          Upgrade Plan
        </button>
      </div>
    );
  }

  return null;
};

const DashboardLayout = () => {
  const [tglState, setTglState] = useRecoilState(toggleState);
  const isSidebarOpen = tglState.sidebarOpen;
  const setIsSidebarOpen = (val) => setTglState(prev => ({ ...prev, sidebarOpen: val }));

  const location = useLocation();
  const isFullScreen = false;

  const user = JSON.parse(
    localStorage.getItem('user') || '{"name":"User"}'
  );

  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex bg-transparent text-maintext overflow-hidden aisa-scalable-text">
      {/* Animated Atmospheric Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#f8fafc] via-[#eef2ff] to-[#fce7f3] dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e1b4b] overflow-hidden">
        <motion.div
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/20 dark:bg-primary/5 blur-[120px]"
        />
        <motion.div
          animate={{
            y: [0, -40, 0],
            x: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 dark:bg-primary/5 blur-[120px]"
        />
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px]"
        />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
        <PlanExpiryBanner />

        {/* Mobile Header - Hide on Chat/Assistant if they provide their own toggle */}
        {!isFullScreen && !location.pathname.includes('/chat') && !location.pathname.includes('/ai-personal-assistant') && (
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-secondary shrink-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-surface text-maintext active:bg-surface/80 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" state={{ fromLogo: true }} className="font-bold text-lg text-primary hover:opacity-80 transition-opacity">
                AISA <sup className="text-[10px]">TM</sup>
              </Link>
            </div>

            <div
              onClick={() => navigate(user.email ? '/dashboard/profile' : '/login')}
              className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase cursor-pointer hover:bg-primary/30 transition-colors"
            >
              {user.name?.charAt(0) || 'U'}
            </div>
          </div>
        )}

        {/* Menu Button for Mobile if needed can be kept, but Sidebar is usually toggled by header */}

        {/* Outlet for pages */}
        <main className={`flex-1 overflow-y-auto relative w-full scroll-smooth p-0`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ------------------------------
// Placeholder Page
// ------------------------------

const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-full text-subtext flex-col">
    <h2 className="text-2xl font-bold mb-2 text-maintext">{title}</h2>
    <p>Coming soon...</p>
  </div>
);

// ------------------------------
// App Router
// ------------------------------

import { Toaster } from 'react-hot-toast';

const NavigateProvider = () => {
  const [tglState] = useRecoilState(toggleState);

  return (
    <SubscriptionProvider>
      <Toaster position="top-right" />
      <UpgradeModal />
      <CookieConsentBanner />
      <AnimatePresence>
        {tglState.platformSubTgl && <PlatformSubscriptionModal />}
      </AnimatePresence>
      <Routes>
        {/* Public Routes */}
        <Route path={AppRoute.LANDING} element={<HomeRedirect />} />
        <Route path={AppRoute.LOGIN} element={<GuestRoute><Login /></GuestRoute>} />
        <Route path={AppRoute.SIGNUP} element={<GuestRoute><Signup /></GuestRoute>} />

        <Route path={AppRoute.E_Verification} element={<VerificationForm />} />
        <Route path={AppRoute.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={AppRoute.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={AppRoute.PRIVACY_POLICY} element={<PrivacyPolicy />} />
        <Route path={AppRoute.TERMS_OF_SERVICE} element={<TermsOfService />} />
        <Route path={AppRoute.COOKIE_POLICY} element={<CookiePolicy />} />

        {/* Dashboard (Protected) */}
        <Route
          path={AppRoute.DASHBOARD}
          element={<DashboardLayout />}
        >
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="chat/:sessionId?" element={<Chat />} />
          <Route path="ai-personal-assistant" element={<ProtectedRoute><AiPersonalAssistantDashboard /></ProtectedRoute>} />

          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="security" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <SecurityAndGuidelines />
            </Suspense>
          } />
        </Route>


        {/* Vendor Dashboard Routes (Public for MVP/Testing) */}


        {/* Catch All */}
        <Route path="*" element={<Navigate to={AppRoute.LANDING} replace />} />
      </Routes>
    </SubscriptionProvider>
  );
};

export default NavigateProvider;