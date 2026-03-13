import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Key, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API, apis, AppRoute } from '../types';
import { setUserData, userData as userDataAtom } from '../userStore/userData';
import { useSetRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';

import loginBg from './login_bg.gif';


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const setUserRecoil = useSetRecoilState(userDataAtom);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [socialVerifying, setSocialVerifying] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Handle Social Auth Callback from Backend
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isSocialAuth = params.get('social_auth');
    const token = params.get('token');
    const userId = params.get('userId');
    const userName = params.get('userName');
    const userEmail = params.get('userEmail');
    const provider = params.get('provider');
    const picture = params.get('picture');

    if (isSocialAuth && token && userId) {
      toast.success(`Successfully authenticated as ${userName}!`);
      
      const userData = {
        id: userId,
        name: userName,
        email: userEmail,
        token: token,
        role: "user",
        plan: "Basic",
        provider: provider || "local",
        avatar: picture || ""
      };

      // Real state update & storage
      setUserData(userData);
      setUserRecoil({ user: userData });
      localStorage.setItem("userId", userId);
      localStorage.setItem("token", token);
      localStorage.setItem("provider", provider || "local");

      const from = location.state?.from || AppRoute.DASHBOARD;
      navigate(from, { replace: true });
    }
  }, [location, navigate, setUserRecoil]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setError(false);

    try {
      const payload = { email, password };
      const res = await axios.post(apis.logIn, payload);

      toast.success(t('successLogin'));
      const from = location.state?.from || AppRoute.DASHBOARD;

      setUserData(res.data);
      setUserRecoil({ user: res.data });
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("token", res.data.token);

      navigate(from, { replace: true });
    } catch (err) {
      setError(true);
      const errorMessage = err.response?.data?.error || err.message || t('serverError');
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setGoogleLoading(true);
    setError(false);
    setMessage(null);

    try {
      // Get user info from Google using the access token
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });

      const { email, name, picture } = userInfoRes.data;

      // Send to our backend
      const res = await axios.post(apis.googleLogin, {
        credential: tokenResponse.access_token,
        email,
        name,
        picture
      });

      toast.success('Logged in with Google!');
      const from = location.state?.from || AppRoute.DASHBOARD;

      setUserData(res.data);
      setUserRecoil({ user: res.data });
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("token", res.data.token);

      navigate(from, { replace: true });
    } catch (err) {
      setError(true);
      const errorMessage = err.response?.data?.error || 'Google login failed';
      setMessage(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      setError(true);
      setMessage('Google login was cancelled or failed');
    },
  });

  const handleOtherSocialLogin = async (provider) => {
    // For a REAL OAuth flow, we redirect the entire browser window to the backend 
    // which then initiates the handshake with the social provider (GitHub, FB, etc.)

    setGoogleLoading(true);
    setSocialVerifying({ provider, step: `Redirecting to ${provider} Secure Login...` });

    // Construct the backend auth URL safely
    // Redirecting to backend which then handles provider-specific handshake
    const backendAuthUrl = provider.toLowerCase() === 'microsoft' 
      ? apis.microsoftLogin 
      : apis.logIn.replace('/login', `/${provider.toLowerCase()}`);

    toast.loading(`Opening ${provider} Login...`);

    // Small delay just so the user sees our premium loading state before the redirect
    setTimeout(() => {
      window.location.href = backendAuthUrl;
    }, 800);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#f8fafc] dark:bg-[#020617] aisa-scalable-text p-4 md:p-8">
      {/* Background Blobs - STATIC */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden text-black dark:text-white">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/20 dark:bg-primary/10 blur-[100px] rounded-full" />
      </div>

      {/* Content Container - Vertically Centered */}
      <div className="relative w-full max-w-[400px] flex flex-col items-center z-50 transform -translate-y-2">
        
        {/* Robot Logo - Scaled for all devices */}
        <div className="w-full flex justify-center mb-1 shrink-0">
          <img
            src={loginBg}
            alt="AISA Logo"
            className="w-[120px] sm:w-[150px] h-auto object-contain opacity-[1] brightness-110 drop-shadow-2xl"
          />
        </div>

        {/* Main Glass Card */}
        <div className="relative w-full overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-[64px] border border-white dark:border-white/10 p-5 sm:p-6 rounded-[2.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] text-center group/card scale-[0.9] sm:scale-100 origin-top">
          {/* Glossy Reflection Effect */}
          <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none" />

          <div className="text-center mb-4 relative">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tighter uppercase">{t('welcomeBack')}</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">{t('signInToContinue')}</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 justify-center"
              >
                <AlertCircle className="w-3 h-3" />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Real-time Avatar Preview */}
          <div className="flex justify-center mb-6">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover/avatar:bg-primary/30 transition-all opacity-50" />
              <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center relative translate-y-[-10px]">
                {(() => {
                  const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
                  const normalized = email.trim().toLowerCase();
                  const previewUrl = normalized.includes('@') && normalized.length > 5
                    ? `${baseUrl}/api/auth/proxy-avatar?email=${encodeURIComponent(normalized)}&name=U`
                    : `https://ui-avatars.com/api/?name=A&background=random&color=fff`;
                  
                  return <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />;
                })()}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-white placeholder-slate-400/70 focus:outline-none transition-all font-medium text-lg backdrop-blur-md"
                required
              />
            </div>

            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 rounded-xl py-3 pl-12 pr-12 text-slate-700 dark:text-white placeholder-slate-400/70 focus:outline-none transition-all font-medium text-lg tracking-[0.3em] backdrop-blur-md"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "LOGIN"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">or sign in with</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
          </div>

          <div className="space-y-2">
            {/* Google Login Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => googleLogin()}
              disabled={googleLoading}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-white shadow-sm transition-all flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            {/* Toggle for More Options */}
            <button 
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-primary transition-colors group"
            >
              <span>{showMoreOptions ? "Show Less" : "More Login Options"}</span>
              <motion.div animate={{ rotate: showMoreOptions ? 180 : 0 }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {showMoreOptions && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    {[
                      { name: 'Facebook', color: '#1877F2', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                      { name: 'GitHub', color: '#24292e', icon: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
                      { name: 'Apple', color: '#000000', icon: 'M17.073 21.321c-.985.93-2.128 2.094-3.535 2.094-1.38 0-1.842-.843-3.535-.843-1.692 0-2.217.828-3.534.828-1.334 0-2.583-1.218-3.535-2.109C.951 19.33-.275 16.143.2 13.041c.212-3.087 1.859-4.739 3.655-4.739 1.153 0 1.951.725 2.91 0 1.077-.852 2.1-.852 2.91 0 1.127.76 2.062 1.488 2.441 2.268-2.693 1.15-3.136 4.757-.751 6.136.985.59 2.01.635 2.502.635 0 0 .151.01.442.012l.144-.012-.045.012c-.105.451-.629 1.831-1.365 2.968zm-3.085-15.011c0 2.243-1.859 4.072-4.148 4.072-.116 0-.256-.014-.383-.028.099-2.228 1.956-4.072 4.148-4.072.164 0 .285.014.383.028z' },
                      { name: 'Microsoft', color: '#00A4EF', icon: 'M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z' },
                      { name: 'Twitter', color: '#1DA1F2', icon: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
                      { name: 'LinkedIn', color: '#0077B5', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.205 24 24 23.227 24 22.271V1.729C24 .774 23.205 0 22.225 0z' },
                      { name: 'Discord', color: '#5865F2', icon: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037 19.736 19.736 0 00-4.885 1.515.069.069 0 00-.032.027C.533 9.048-.32 13.572.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.125-.094.252-.192.37-.294a.077.077 0 01.077-.01c3.927 1.793 8.18 1.793 12.062 0a.077.077 0 01.078.01c.12.102.246.2.373.294a.077.077 0 01-.006.127 12.298 12.298 0 01-1.873.893.077.077 0 00-.041.107 14.361 14.361 0 001.226 1.994.077.077 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.176 2.419 0 1.334-.966 2.419-2.176 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.176 2.419 0 1.334-.946 2.419-2.176 2.419z' },
                    ].map((social) => (
                      <motion.button
                        key={social.name}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOtherSocialLogin(social.name)}
                        className="py-2.5 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm"
                        title={`Continue with ${social.name}`}
                      >
                        <svg className="w-4 h-4" style={{ fill: social.color }} viewBox="0 0 24 24">
                          <path d={social.icon} />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tighter truncate">{social.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <Link to="/forgot-password" opacity={0.6} className="text-[9px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase tracking-widest">
              Forgot Password?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 dark:border-slate-800/50 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
            No account? <Link to="/signup" className="text-primary hover:underline ml-1 uppercase font-black">Create Now</Link>
          </div>
        </div>

        <Link to="/" className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-[9px] uppercase tracking-widest transition-all">
          <ArrowLeft className="w-3 h-3" />
          {t('backToHome')}
        </Link>
      </div>

      {/* High-Fidelity Social Auth Overlay */}
      <AnimatePresence>
        {socialVerifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#f8fafc]/80 dark:bg-[#020617]/90 backdrop-blur-xl"
          >
            <div className="relative p-10 max-w-[320px] w-full text-center">
              {/* Animated Glow */}
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse" />

              <div className="relative space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl border border-white/20 flex items-center justify-center relative shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {socialVerifying.provider} AUTH
                  </h3>
                  <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                    {socialVerifying.step}
                  </p>
                </div>

                <div className="pt-4">
                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-widest rounded-full">
                    Secure SSO Connection
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
