import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Key, User, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AppRoute, apis } from '../types';
import axios from 'axios';
import { setUserData, userData as userDataAtom } from '../userStore/userData';
import { useSetRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const setUserRecoil = useSetRecoilState(userDataAtom);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(t('passwordValidation'));
      setIsLoading(false);
      return;
    }

    try {
      const payLoad = { name, email, password };
      const res = await axios.post(apis.signUp, payLoad);

      setUserData(res.data);
      setUserRecoil({ user: res.data });

      navigate(AppRoute.E_Verification, { state: location.state });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    console.log('[Google Signup] Success callback received:', tokenResponse);
    setGoogleLoading(true);
    setError(null);
    setPasswordError(null);

    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });

      console.log('[Google Signup] User info:', userInfoRes.data);
      const { email, name, picture } = userInfoRes.data;

      const res = await axios.post(apis.googleLogin, {
        credential: tokenResponse.access_token,
        email,
        name,
        picture
      });

      console.log('[Google Signup] Backend response:', res.data);
      toast.success('Signed up with Google!');
      const from = location.state?.from || AppRoute.DASHBOARD;

      setUserData(res.data);
      setUserRecoil({ user: res.data });
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("token", res.data.token);

      navigate(from, { replace: true });
    } catch (err) {
      console.error('[Google Signup] Error:', err);
      setError(err.response?.data?.error || 'Google signup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (err) => {
      console.error('[Google Signup] Google OAuth Error:', err);
      setError('Google signup was cancelled or failed');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden selection:bg-primary/20 bg-[#f8fafc] dark:bg-[#020617] aisa-scalable-text">
      {/* Background Blobs for Glassmorphism Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] bg-primary/20 dark:bg-primary/10 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-primary/20 dark:bg-primary/10 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 dark:bg-primary/5 blur-[160px] rounded-full"
        />
      </div>

      {/* Content Container */}
      <div className="relative w-full max-w-5xl flex flex-col items-center p-4">
        {/* SMALL FLOATING GLASS PANEL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-50 w-full max-w-[460px] transition-all"
        >
          {/* Main Glass Card */}
          <div className="relative overflow-hidden bg-white/10 dark:bg-white/[0.04] backdrop-blur-[64px] border border-white/60 dark:border-white/10 p-10 rounded-[3.5rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.12)] text-center ring-1 ring-white/30 transition-all hover:bg-white/15 dark:hover:bg-white/[0.06] group/card">
            {/* Glossy Reflection Effect */}
            <div className="absolute -top-[100%] -left-[100%] w-[300%] h-[300%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45 pointer-events-none transition-transform duration-1000 group-hover/card:translate-x-1/2 group-hover/card:translate-y-1/2" />

            <div className="text-center mb-10 relative">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-1.5 tracking-tighter uppercase">{t('createAccount')}</h2>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{t('joinAISA')}</p>
            </div>

            <AnimatePresence mode="wait">
              {(error || passwordError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 justify-center backdrop-blur-md"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error || passwordError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field - Glassy Style */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 dark:bg-slate-900/40 rounded-2xl blur-sm transition-all group-focus-within:bg-white/50 dark:group-focus-within:bg-slate-900/60" />
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10" />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="relative w-full bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 rounded-2xl py-4.5 pl-14 pr-4 text-slate-700 dark:text-white placeholder-slate-400/70 focus:outline-none focus:ring-1 focus:ring-white/50 dark:focus:ring-white/10 transition-all font-medium text-lg backdrop-blur-md"
                  required
                />
              </div>

              {/* Email Field - Glassy Style */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 dark:bg-slate-900/40 rounded-2xl blur-sm transition-all group-focus-within:bg-white/50 dark:group-focus-within:bg-slate-900/60" />
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="relative w-full bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 rounded-2xl py-4.5 pl-14 pr-4 text-slate-700 dark:text-white placeholder-slate-400/70 focus:outline-none focus:ring-1 focus:ring-white/50 dark:focus:ring-white/10 transition-all font-medium text-lg backdrop-blur-md"
                  required
                />
              </div>

              {/* Password Field - Glassy Style */}
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 dark:bg-slate-900/40 rounded-2xl blur-sm transition-all group-focus-within:bg-white/50 dark:group-focus-within:bg-slate-900/60" />
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secure Password"
                  className="relative w-full bg-white/20 dark:bg-slate-800/20 border border-white/30 dark:border-white/5 rounded-2xl py-4.5 pl-14 pr-12 text-slate-700 dark:text-white placeholder-slate-400/70 focus:outline-none focus:ring-1 focus:ring-white/50 dark:focus:ring-white/10 transition-all font-medium tracking-[0.4em] text-lg backdrop-blur-md"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="flex items-start gap-3 mt-2 px-1">
                <input
                  type="checkbox"
                  id="terms-agree"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary rounded border-slate-300 cursor-pointer shrink-0"
                />
                <label htmlFor="terms-agree" className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary hover:underline font-semibold">Terms of Service</Link>,{' '}
                  <Link to="/privacy-policy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>, and{' '}
                  <Link to="/cookie-policy" className="text-primary hover:underline font-semibold">Cookie Policy</Link>
                </label>
              </div>

              {/* Signup Button - Vibrant Blue Style */}
              <motion.button
                whileHover={agreedToTerms ? { y: -5, scale: 1.02 } : {}}
                whileTap={agreedToTerms ? { scale: 0.98 } : {}}
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 ${agreedToTerms
                    ? 'bg-primary shadow-primary/30 hover:shadow-primary/40 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-700 shadow-none cursor-not-allowed opacity-60'
                  }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{t('createAccount')}</span>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/20 dark:bg-slate-700/50" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/20 dark:bg-slate-700/50" />
            </div>

            {/* Google Signup Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => { console.log('[Google Signup] Button clicked'); googleLogin(); }}
              disabled={googleLoading || !agreedToTerms}
              className={`w-full py-4 border rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-3 ${agreedToTerms
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                }`}
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </motion.button>

            <div className="mt-10 pt-8 border-t border-white/10 dark:border-slate-800/50 text-center text-xs font-bold text-slate-400 tracking-wide uppercase relative">
              {t('alreadyHaveAccount')}? <Link to="/login" className="text-primary hover:underline ml-1 uppercase tracking-widest font-black">{t('logIn')}</Link>
            </div>
          </div>

          <Link to="/" className="mt-12 mb-20 flex items-center justify-center gap-2 text-slate-300 hover:text-slate-500 font-black text-[10px] uppercase tracking-widest transition-all group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            {t('backToHome')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
