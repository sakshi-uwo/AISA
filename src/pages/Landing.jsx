import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Bot, Zap, Shield, CircleUser,
    Github, Twitter,
    Linkedin, Mail, MapPin, Phone, Facebook, Instagram, Youtube, MessageSquare, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logo, name, faqs } from '../constants';
import { getUserData } from '../userStore/userData';
import { AppRoute } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, X, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { apis } from '../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PrivacyPolicyModal from '../Components/PolicyModals/PrivacyPolicyModal';
import TermsOfServiceModal from '../Components/PolicyModals/TermsOfServiceModal';
import CookiePolicyModal from '../Components/PolicyModals/CookiePolicyModal';
import AboutAISA from '../Components/AboutAISA';
import { useLanguage } from '../context/LanguageContext';

import ProfileSettingsDropdown from '../Components/ProfileSettingsDropdown/ProfileSettingsDropdown';
import ThemeToggle from '../Components/ThemeToggle';
import { useSubscription } from '../context/SubscriptionContext';
import usePayment from '../hooks/usePayment';

const Landing = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const user = getUserData();
    const { setIsUpgradeModalOpen } = useSubscription();
    const { handlePayment, loading: paymentLoading } = usePayment();
    const [isBrandHovered, setIsBrandHovered] = useState(false);
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [activeTab, setActiveTab] = useState('faq');
    const [issueType, setIssueType] = useState('General Inquiry');
    const [issueText, setIssueText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState(null);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
    const [processingPlanId, setProcessingPlanId] = useState(null);

    useEffect(() => {
        if (!paymentLoading) setProcessingPlanId(null);
    }, [paymentLoading]);

    const toolCosts = [
        { label: "Normal Chat", cost: "1" },
        { label: "Deep Search", cost: "10" },
        { label: "Real-Time Search", cost: "10" },
        { label: "Generate Image", cost: "20" },
        { label: "Generate Video", cost: "70" },
        { label: "Convert Audio", cost: "10" },
        { label: "Convert Document", cost: "10" },
        { label: "Code Writer", cost: "5" }
    ];

    const handleLogout = () => {
        localStorage.clear();
        window.location.reload(); // Simple reload to clear user state which comes from LS
    };

    const issueOptions = [
        "General Inquiry",
        "Payment Issue",
        "Refund Request",
        "Technical Support",
        "Account Access",
        "Other"
    ];

    const handleSupportSubmit = async () => {
        if (!issueText.trim()) return;
        setIsSending(true);
        setSendStatus(null);
        try {
            await axios.post(apis.support, {
                email: user?.email || "guest@uwo24.com",
                issueType,
                message: issueText,
                userId: user?.id || null
            });
            setSendStatus('success');
            setIssueText('');
            setTimeout(() => setSendStatus(null), 3000);
        } catch (error) {
            console.error("Support submission failed", error);
            setSendStatus('error');
        } finally {
            setIsSending(false);
        }
    };
    const { theme, setTheme } = useTheme();
    const btnClass = "px-8 py-4 bg-surface border border-border rounded-2xl font-bold text-lg text-maintext hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-2";

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-slate-950 aisa-scalable-text">
            {/* Background Image Layer with reduced opacity */}
            <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                }}
                className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0"
                style={{
                    backgroundImage: "url('/hero-bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Background Overlay - Balanced Gradient (Top & Bottom) */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/10 dark:from-slate-950/80 dark:via-transparent dark:to-slate-950/80 pointer-events-none z-0" />

            {/* Header */}
            <header className="relative z-10 px-4 py-4 md:px-6 md:py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative flex items-center gap-2 md:gap-3 cursor-pointer group"
                >
                    <img src="/logo/AISA.gif?v=3" alt="AISA Logo" className="w-12 h-12 md:w-20 md:h-20 object-contain hover:rotate-12 transition-transform duration-300" />

                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 md:gap-4 relative"
                >
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {user ? (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsProfileSettingsOpen(!isProfileSettingsOpen)}
                                className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full transition-all group"
                            >
                                <CircleUser className='h-6 w-6 md:h-7 md:w-7 text-primary/80 group-hover:text-primary transition-colors' />
                            </motion.button>
                            <AnimatePresence>
                                {isProfileSettingsOpen && (
                                    <ProfileSettingsDropdown
                                        onClose={() => setIsProfileSettingsOpen(false)}
                                        onLogout={() => {
                                            handleLogout();
                                            setIsProfileSettingsOpen(false);
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex gap-4 items-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/login")}
                                className="flex items-center gap-2 text-sm md:text-base text-slate-700 dark:text-slate-200 font-bold px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-all"
                            >
                                <span>{t('logIn')}</span>
                                <div className="flex items-center justify-center">
                                    <CircleUser className="w-5 h-5 md:w-6 md:h-6 text-primary/70 group-hover:text-primary" />
                                </div>
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </header>

            {/* Hero Section */}
            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 py-20"
            >
                <motion.div
                    variants={item}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 dark:bg-black/40 border border-primary/20 text-sm text-black dark:text-white mb-8 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    {t('poweredByUWO')}
                </motion.div>

                <motion.h1
                    variants={item}
                    className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-black dark:text-gray-100"
                >
                    {t('heroTitle')}
                </motion.h1>

                <motion.p
                    variants={item}
                    className="text-lg text-black dark:text-gray-400 max-w-2xl mb-10 leading-relaxed font-medium"
                >
                    {t('heroSubtitle')}
                </motion.p>

                <motion.div
                    variants={item}
                    className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-2xl"
                >
                    <motion.button
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/dashboard/chat/new")}
                        className="px-8 py-4 bg-primary rounded-2xl font-bold text-lg text-white shadow-xl shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        {t('exploreAisa')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button >

                    {!user && (
                        <motion.button
                            whileHover={{ y: -5, scale: 1.02, backgroundColor: "rgba(255,255,255,0.8)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/login")}
                            className="px-8 py-4 bg-white/60 dark:bg-slate-900/40 border border-border rounded-2xl font-bold text-lg text-maintext transition-all duration-300 backdrop-blur-sm"
                        >
                            {t('existingUser')}
                        </motion.button>
                    )}
                </motion.div >

                {/* Features Preview */}
                <motion.div
                    variants={container}
                    className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left"
                >
                    {
                        [
                            {
                                title: t('intelligenceTitle'),
                                desc: t('intelligenceDesc'),
                                img: "/logo/Intelligence.svg",
                                delay: 0
                            },
                            {
                                title: t('interactionTitle'),
                                desc: t('interactionDesc'),
                                img: "/logo/Interaction.svg",
                                delay: 0.2
                            },
                            {
                                title: t('privacyTitle'),
                                desc: t('privacyDesc'),
                                img: "/logo/Privacy.svg",
                                delay: 0.4
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                variants={item}
                                whileHover={{ y: -10, scale: 1.02, borderColor: "var(--primary)" }}
                                className="p-6 rounded-3xl bg-white/50 dark:bg-[#161B2E] border border-white/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group backdrop-blur-sm cursor-default"
                            >
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: feature.delay }}
                                    className="w-16 h-16 mb-4 group-hover:scale-110 transition-transform"
                                >
                                    <img src={feature.img} alt={feature.title} className="w-full h-full object-contain drop-shadow-md" />
                                </motion.div>
                                <h3 className="text-xl font-bold mb-2 text-black dark:text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-black dark:text-white leading-relaxed">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))
                    }
                </motion.div >

                {/* Pricing Section */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mt-24 md:mt-32 max-w-5xl w-full px-4 text-center z-10 mx-auto"
                >
                    <motion.h2
                        variants={item}
                        className="text-3xl md:text-5xl font-extrabold mb-4 text-black dark:text-white"
                    >
                        Choose Your AISA Power Level
                    </motion.h2>
                    <motion.p
                        variants={item}
                        className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
                    >
                        Pick the plan that fits your AI needs. From casual usage to full-blown enterprise power.
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {/* FREE PLAN */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -6 }}
                            onClick={() => user ? navigate("/dashboard") : navigate("/login")}
                            className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl relative text-left flex flex-col cursor-pointer"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">FREE</h3>
                            <div className="text-2xl font-extrabold text-primary mb-4">₹0<span className="text-sm text-gray-500 dark:text-gray-400 font-medium"> / Month</span></div>
                            <ul className="space-y-2.5 mb-5 flex-1 text-[13px]">
                                {[
                                    '100 Total Credits',
                                    'Access to all tools',
                                    'Standard Support',
                                    '30 Days Validity'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                                        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Usage Guide */}
                            <div className="mb-5 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200/50 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {toolCosts.slice(0, 8).map((tool, tIdx) => (
                                        <div key={tIdx} className="flex justify-between items-center text-[9px] text-gray-500 dark:text-gray-400">
                                            <span className="truncate mr-1">{tool.label}</span>
                                            <span className="font-bold text-primary shrink-0">{tool.cost} cr.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    user ? navigate("/dashboard") : navigate("/login");
                                }}
                                className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                            >
                                {user ? "Go to Dashboard" : "Start Free"}
                            </button>
                        </motion.div>

                        {/* STARTER PLAN */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -6 }}
                            onClick={() => {
                                if (user) {
                                    setProcessingPlanId('STARTER');
                                    handlePayment('STARTER', user, () => navigate("/dashboard"));
                                } else {
                                    navigate("/login");
                                }
                            }}
                            className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl relative text-left flex flex-col cursor-pointer"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">STARTER</h3>
                            <div className="text-2xl font-extrabold text-primary mb-4">₹500<span className="text-sm text-gray-500 dark:text-gray-400 font-medium"> / Month</span></div>
                            <ul className="space-y-2.5 mb-5 flex-1 text-[13px]">
                                {[
                                    '500 Total Credits',
                                    'Faster Tools',
                                    'Priority Support',
                                    '30 Days Validity'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                                        <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Usage Guide */}
                            <div className="mb-5 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200/50 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {toolCosts.slice(0, 8).map((tool, tIdx) => (
                                        <div key={tIdx} className="flex justify-between items-center text-[9px] text-gray-500 dark:text-gray-400">
                                            <span className="truncate mr-1">{tool.label}</span>
                                            <span className="font-bold text-primary shrink-0">{tool.cost} cr.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (user) {
                                        setProcessingPlanId('STARTER');
                                        handlePayment('STARTER', user, () => navigate("/dashboard"));
                                    } else {
                                        navigate("/login");
                                    }
                                }}
                                disabled={paymentLoading}
                                className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                            >
                                {paymentLoading && processingPlanId === 'STARTER' ? "Processing..." : "Choose Starter"}
                            </button>
                        </motion.div>

                        {/* PRO PLAN */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -6 }}
                            onClick={() => {
                                if (user) {
                                    setProcessingPlanId('PRO');
                                    handlePayment('PRO', user, () => navigate("/dashboard"));
                                } else {
                                    navigate("/login");
                                }
                            }}
                            className="bg-gradient-to-b from-primary/10 to-primary/5 dark:from-primary/20 dark:to-[#161B2E]/90 backdrop-blur-md rounded-[2rem] p-6 border-2 border-primary shadow-xl relative text-left flex flex-col transform md:-translate-y-2 cursor-pointer"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                MOST POPULAR
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">PRO</h3>
                            <div className="text-2xl font-extrabold text-primary mb-4">₹2850<span className="text-sm text-gray-500 dark:text-gray-400 font-medium"> / Month</span></div>
                            <ul className="space-y-2.5 mb-5 flex-1 text-[13px]">
                                {[
                                    '3,000 Total Credits',
                                    'Elite AI Models',
                                    'Instant Support',
                                    '30 Days Validity'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5 text-gray-800 dark:text-gray-200 font-medium">
                                        <Zap className="w-3.5 h-3.5 text-primary shrink-0 fill-primary/20" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Usage Guide */}
                            <div className="mb-5 p-2.5 rounded-2xl bg-white/40 dark:bg-primary/10 border border-primary/20">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {toolCosts.slice(0, 8).map((tool, tIdx) => (
                                        <div key={tIdx} className="flex justify-between items-center text-[9px] text-gray-800 dark:text-gray-200 font-bold">
                                            <span className="truncate mr-1">{tool.label}</span>
                                            <span className="font-bold text-primary shrink-0">{tool.cost} cr.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (user) {
                                        setProcessingPlanId('PRO');
                                        handlePayment('PRO', user, () => navigate("/dashboard"));
                                    } else {
                                        navigate("/login");
                                    }
                                }}
                                disabled={paymentLoading}
                                className="w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-white shadow-lg shadow-primary/30 hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02]"
                            >
                                {paymentLoading && processingPlanId === 'PRO' ? "Processing..." : "Upgrade to Pro"}
                            </button>
                        </motion.div>

                        {/* BUSINESS PLAN */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -6 }}
                            onClick={() => {
                                if (user) {
                                    setProcessingPlanId('BUSINESS');
                                    handlePayment('BUSINESS', user, () => navigate("/dashboard"));
                                } else {
                                    navigate("/login");
                                }
                            }}
                            className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl relative text-left flex flex-col cursor-pointer"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">BUSINESS</h3>
                            <div className="text-2xl font-extrabold text-primary mb-4">₹4500<span className="text-sm text-gray-500 dark:text-gray-400 font-medium"> / Month</span></div>
                            <ul className="space-y-2.5 mb-5 flex-1 text-[13px]">
                                {[
                                    '5,000 Total Credits',
                                    'Collaboration Tools',
                                    'Business Analytics',
                                    '30 Days Validity'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                                        <Zap className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Usage Guide */}
                            <div className="mb-5 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200/50 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {toolCosts.slice(0, 8).map((tool, tIdx) => (
                                        <div key={tIdx} className="flex justify-between items-center text-[9px] text-gray-500 dark:text-gray-400">
                                            <span className="truncate mr-1">{tool.label}</span>
                                            <span className="font-bold text-primary shrink-0">{tool.cost} cr.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (user) {
                                        setProcessingPlanId('BUSINESS');
                                        handlePayment('BUSINESS', user, () => navigate("/dashboard"));
                                    } else {
                                        navigate("/login");
                                    }
                                }}
                                disabled={paymentLoading}
                                className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                            >
                                {paymentLoading && processingPlanId === 'BUSINESS' ? "Processing..." : "Go Business"}
                            </button>
                        </motion.div>

                        {/* ENTERPRISE PLAN */}
                        <motion.div
                            variants={item}
                            whileHover={{ y: -6 }}
                            onClick={() => {
                                if (user) {
                                    setProcessingPlanId('ENTERPRISE');
                                    handlePayment('ENTERPRISE', user, () => navigate("/dashboard"));
                                } else {
                                    navigate("/login");
                                }
                            }}
                            className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl relative text-left flex flex-col cursor-pointer"
                        >
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">ENTERPRISE</h3>
                            <div className="text-2xl font-extrabold text-primary mb-4">₹8000<span className="text-sm text-gray-500 dark:text-gray-400 font-medium"> / Month</span></div>
                            <ul className="space-y-2.5 mb-5 flex-1 text-[13px]">
                                {[
                                    '100,000 Total Credits',
                                    'Custom Solutions',
                                    '24/7 Dedicated Support',
                                    '30 Days Validity'
                                ].map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                                        <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Usage Guide */}
                            <div className="mb-5 p-2.5 rounded-2xl bg-gray-50/50 dark:bg-slate-800/30 border border-gray-200/50 dark:border-white/5">
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {toolCosts.slice(0, 8).map((tool, tIdx) => (
                                        <div key={tIdx} className="flex justify-between items-center text-[9px] text-gray-500 dark:text-gray-400">
                                            <span className="truncate mr-1">{tool.label}</span>
                                            <span className="font-bold text-primary shrink-0">{tool.cost} cr.</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (user) {
                                        setProcessingPlanId('ENTERPRISE');
                                        handlePayment('ENTERPRISE', user, () => navigate("/dashboard"));
                                    } else {
                                        navigate("/login");
                                    }
                                }}
                                disabled={paymentLoading}
                                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300"
                            >
                                {paymentLoading && processingPlanId === 'ENTERPRISE' ? "Processing..." : "Get Enterprise"}
                            </button>
                        </motion.div>
                    </div>

                </motion.div>


            </motion.main >

            {/* Footer Section */}
            < motion.footer
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full bg-white/40 dark:bg-[#0B0F19] border-t border-white/20 dark:border-white/5 mt-20 relative z-10 backdrop-blur-xl rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent dark:from-slate-900/40 pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-center gap-10 lg:gap-20 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-6 max-w-sm">
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <img src="/logo/AISA.gif?v=3" alt="AISA Logo" className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform duration-300" />
                                <span className="text-xl font-bold text-primary tracking-tighter">AISA <sup className="text-[10px]">TM</sup></span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {[
                                    { img: "/social-media-icons/Linkedin.svg", href: "https://www.linkedin.com/in/aimall-global/", label: "LinkedIn" },
                                    { img: "/social-media-icons/X.svg", href: "https://x.com/aimallglobal", label: "Twiter" },
                                    { img: "/social-media-icons/FB.svg", href: "https://www.facebook.com/aimallglobal/", label: "Facebook" },
                                    { img: "/social-media-icons/Threads.svg", href: "https://www.threads.net/@aimall.global", label: "Threads" },
                                    { img: "/social-media-icons/Insta.svg", href: "https://www.instagram.com/aimall.global/", label: "Instagram" },
                                    { img: "/social-media-icons/YT.svg", href: "https://www.youtube.com/@aimallglobal", label: "YouTube" },
                                    { img: "/social-media-icons/Whatsapp.svg", href: "https://api.whatsapp.com/send?phone=918359890909", label: "WhatsApp" }
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-md overflow-hidden hover:scale-110 transition-all duration-300"
                                        aria-label={social.label}
                                    >
                                        <img
                                            src={social.img}
                                            alt={social.label}
                                            className={`w-full h-full object-cover ${['Twiter', 'Threads'].includes(social.label) ? 'dark:invert' : ''}`}
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>



                        {/* Support Column */}
                        <div>
                            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">{t('support')}</h4>
                            <ul className="space-y-4">
                                {[
                                    { label: t('helpCenter'), onClick: () => setIsFaqOpen(true) },
                                    { label: t('aboutAisa'), onClick: () => setIsAboutModalOpen(true) },
                                ].map((link, i) => (
                                    <li key={i}>
                                        {link.onClick ? (
                                            <button
                                                onClick={link.onClick}
                                                className="text-sm text-maintext hover:text-primary hover:underline decoration-primary underline-offset-4 transition-all font-medium opacity-80 hover:opacity-100"
                                            >
                                                {link.label}
                                            </button>
                                        ) : (
                                            <a
                                                href={link.path}
                                                className="text-sm text-subtext hover:text-primary hover:underline decoration-primary underline-offset-4 transition-all font-medium"
                                            >
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div className="space-y-6">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">{t('contact')}</h4>
                            <div className="space-y-4">
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Jabalpur+Madhya+Pradesh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 group"
                                >
                                    <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm text-maintext leading-relaxed group-hover:text-primary transition-colors opacity-80">
                                        {t('city')}
                                    </p>
                                </a>
                                <a
                                    href="mailto:admin@uwo24.com"
                                    className="flex items-center gap-3 group"
                                >
                                    <Mail className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-maintext group-hover:text-primary group-hover:underline decoration-primary underline-offset-4 transition-all font-medium opacity-80">
                                        admin@uwo24.com
                                    </span>
                                </a>
                                <a
                                    href="tel:+918358990909"
                                    className="flex items-center gap-3 group"
                                >
                                    <Phone className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm text-maintext group-hover:text-primary transition-colors font-medium opacity-80">
                                        +91 83589 90909
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
                        <p className="text-xs text-maintext font-medium opacity-80">
                            © {new Date().getFullYear()} {name} <sup className="text-xs">TM</sup>. {t('allRightsReserved')}
                        </p>
                        <div className="flex items-center gap-8">
                            <button onClick={() => setIsPrivacyModalOpen(true)} className="text-xs text-maintext hover:text-primary hover:underline decoration-primary underline-offset-4 transition-all font-medium opacity-80 hover:opacity-100">{t('privacyPolicy')}</button>
                            <button onClick={() => setIsTermsModalOpen(true)} className="text-xs text-maintext hover:text-primary hover:underline decoration-primary underline-offset-4 transition-all font-medium opacity-80 hover:opacity-100">{t('termsOfService')}</button>
                            <button onClick={() => setIsCookieModalOpen(true)} className="text-xs text-maintext hover:text-primary hover:underline decoration-primary underline-offset-4 transition-all font-medium opacity-80 hover:opacity-100">{t('cookiePolicy')}</button>
                        </div>
                    </div>
                </div>
            </motion.footer >

            {/* FAQ Modal */}
            {
                isFaqOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#161B2E] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-white/5">
                            <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-blue-50 dark:bg-[#0E1220]">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('faq')}
                                        className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'faq' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        {t('faq')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('help')}
                                        className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        {t('help')}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setIsFaqOpen(false)}
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeTab === 'faq' ? (
                                    <>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('faqSubtitle')}</p>
                                        {faqs.map((faq, index) => (
                                            <div key={index} className="border border-gray-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#121624] overflow-hidden hover:border-primary/30 transition-all">
                                                <button
                                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                                    className="w-full flex justify-between items-center p-4 text-left hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                                                >
                                                    <span className="font-semibold text-gray-900 dark:text-white text-[15px]">{faq.question}</span>
                                                    {openFaqIndex === index ? (
                                                        <ChevronUp className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                    )}
                                                </button>
                                                <div
                                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100 bg-blue-50/50 dark:bg-gray-800/50' : 'max-h-0 opacity-0'}`}
                                                >
                                                    <div className="p-4 pt-0 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-200 dark:border-gray-700 mt-2 pt-3">
                                                        {faq.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{t('selectIssueCategory')}</label>
                                            <div className="relative">
                                                <select
                                                    value={issueType}
                                                    onChange={(e) => setIssueType(e.target.value)}
                                                    className="w-full p-4 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary outline-none appearance-none text-gray-900 dark:text-white font-medium cursor-pointer hover:border-primary/40 transition-colors"
                                                >
                                                    {issueOptions.map((opt) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">{t('describeYourIssue')}</label>
                                            <textarea
                                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary outline-none resize-none text-gray-900 dark:text-white min-h-[150px]"
                                                placeholder={t('issuePlaceholder')}
                                                value={issueText}
                                                onChange={(e) => setIssueText(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSupportSubmit}
                                            disabled={isSending || !issueText.trim()}
                                            className={`flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 ${isSending || !issueText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                                        >
                                            {isSending ? (
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <HelpCircle className="w-5 h-5" />
                                                    {t('submitSupport')}
                                                </>
                                            )}
                                        </button>
                                        {sendStatus === 'success' && (
                                            <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                                                {t('ticketSuccess')}
                                            </div>
                                        )}
                                        {sendStatus === 'error' && (
                                            <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                                {t('ticketError')}
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                                            {t('orEmailUsAt')} <a href="mailto:admin@uwo24.com" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">admin@uwo24.com</a>
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-center">
                                <button
                                    onClick={() => setIsFaqOpen(false)}
                                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <TermsOfServiceModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
            <CookiePolicyModal isOpen={isCookieModalOpen} onClose={() => setIsCookieModalOpen(false)} />
            <AboutAISA isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />

        </div >
    );
};

export default Landing;
