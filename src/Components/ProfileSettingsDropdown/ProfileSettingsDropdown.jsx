import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Bell, Sparkles, LayoutGrid,
    Database, Shield, Lock, User,
    X, ChevronDown, Play, Globe,
    LogOut, Monitor, Mic, Check,
    ChevronLeft, ChevronRight, Trash2, ShieldCheck, Mail, Volume2, Plus,
    Palette, Type, RefreshCcw, Languages, Crown, History, Calendar, CreditCard, Download, Search, Zap
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { usePersonalization } from '../../context/PersonalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserData, getAccounts, removeAccount, setUserData, updateUser, userData } from '../../userStore/userData';
import { useRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API, apis } from '../../types';
import CustomSelect from '../CustomSelect/CustomSelect';

const ProfileSettingsDropdown = ({ onClose, onLogout }) => {
    const [currentUserData, setUserRecoil] = useRecoilState(userData);
    const user = currentUserData.user || getUserData();
    const {
        personalizations,
        updatePersonalization,
        resetPersonalizations,
        notifications,
        deleteNotification,
        clearAllNotifications,
        chatSessions
    } = usePersonalization();
    const { theme, setTheme, accentColor, setAccentColor, ACCENT_COLORS } = useTheme();
    const { language, setLanguage, languages, t } = useLanguage();
    const [activeTab, setActiveTab] = useState('personalization');
    const [view, setView] = useState('sidebar'); // 'sidebar' or 'detail' for mobile
    const [accounts, setAccounts] = useState(getAccounts());
    const [nicknameInput, setNicknameInput] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [creditLogs, setCreditLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedDate, setExpandedDate] = useState(null);

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [planName, setPlanName] = useState("Free Plan");

    const groupedSessions = useMemo(() => {
        const groups = {};
        if (!chatSessions) return groups;
        chatSessions.forEach(session => {
            const d = new Date(session.lastModified);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(session);
        });
        return groups;
    }, [chatSessions]);

    useEffect(() => {
        setNicknameInput(personalizations.account?.nickname || '');
    }, [personalizations.account?.nickname]);

    useEffect(() => {
        if (user?.token) {
            // Fetch Plan & Transactions
            fetchTransactions();

            // Sync user profile
            axios.get(apis.user, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            }).then(res => {
                if (res.data) {
                    const mergedData = setUserData(res.data);
                    setUserRecoil(prev => ({ ...prev, user: mergedData }));
                }
            }).catch(err => console.error("Profile sync failed", err));

            // Fetch Subscription Details
            axios.get(`${API}/subscription`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            }).then(res => {
                if (res.data.success && res.data.subscription?.planId?.planName) {
                    setPlanName(res.data.subscription.planId.planName);
                } else if (res.data.founderStatus) {
                    setPlanName("Founder Plan");
                }
            }).catch(err => console.error("Subscription check failed", err));
        }
    }, [user?.token]);

    useEffect(() => {
        if (activeTab === 'credits' && user?.token) {
            fetchCreditLogs();
        }
    }, [activeTab, user?.token]);

    const fetchCreditLogs = async () => {
        try {
            setLoadingHistory(true);
            const res = await axios.get(`${API}/subscription/credit-history`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.data.success) {
                setCreditLogs(res.data.logs);
            }
        } catch (error) {
            console.error("Failed to fetch credit logs", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(apis.getPaymentHistory, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setTransactions(res.data.filter(tx => tx.amount > 0));
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        }
    };

    const handleAccountLogout = (email) => {
        removeAccount(email);
        const updated = getAccounts();
        setAccounts(updated);
        if (updated.length === 0) {
            onLogout();
            onClose();
        } else if (user.email === email) {
            window.location.reload();
        }
    };

    const handleSwitchAccount = (acc) => {
        setUserData(acc);
        window.location.reload();
    };

    const handleSaveNickname = async () => {
        if (nicknameInput) {
            updatePersonalization('account', { nickname: nicknameInput });
            try {
                if (user?.token) {
                    await axios.put(apis.profile, { name: nicknameInput }, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    });
                }
                toast.success('Profile updated successfully');
            } catch (error) {
                toast.success('Profile updated locally');
            }
        }
    };

    const handleSendOtp = async () => {
        setResetLoading(true);
        try {
            await axios.post(apis.forgotPassword, { email: user.email });
            toast.success('OTP sent to your email');
            setResetStep(2);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send OTP');
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!resetOtp || !newPassword) {
            toast.error('Please enter OTP and New Password');
            return;
        }
        setResetLoading(true);
        try {
            await axios.post(apis.resetPassword, {
                email: user.email,
                otp: resetOtp,
                newPassword: newPassword
            });
            toast.success('Password updated successfully');
            setShowResetModal(false);
            setResetStep(1);
            setResetOtp('');
            setNewPassword('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    const tabs = [
        { id: 'personalization', label: t('personalization'), icon: Sparkles },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'data', label: t('dataControls'), icon: Database },
        { id: 'account', label: t('account'), icon: User }
    ];

    const renderSettingRow = (label, description, control) => (
        <div className="flex flex-wrap items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 last:border-0 gap-4">
            <div className="flex flex-col gap-1 pr-4 min-w-[200px] flex-1">
                <span className="text-[14px] font-bold text-gray-700 dark:text-gray-200">{label}</span>
                {description && <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{description}</span>}
            </div>
            <div className="shrink-0">
                {control}
            </div>
        </div>
    );

    const renderDropdown = (value, options, onChange, icon) => (
        <div className="w-[160px] sm:w-[200px]">
            <CustomSelect value={value} options={options} onChange={onChange} icon={icon} />
        </div>
    );

    const renderToggle = (value, onToggle) => (
        <button
            onClick={() => onToggle(!value)}
            className={`w-11 h-6 rounded-full p-1 transition-all duration-300 shrink-0 ${value ? 'bg-primary' : 'bg-gray-200 dark:bg-zinc-700'}`}
        >
            <div className={`w-4 h-4 rounded-full transition-transform duration-300 shadow-sm bg-white ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const [searchQuery, setSearchQuery] = useState('');

    const allSettings = useMemo(() => {
        const settings = [];

        // Personalization
        settings.push({
            id: 'theme', tab: 'personalization', label: t('appearance'), description: t('appearanceDesc'), keywords: 'dark mode light mode',
            component: renderSettingRow(t('appearance'), t('appearanceDesc'), renderDropdown(t(theme), [t('system'), t('dark'), t('light')], (e) => setTheme(e.target.value === t('system') ? 'system' : e.target.value === t('dark') ? 'dark' : 'light'), Monitor))
        });
        settings.push({
            id: 'accent', tab: 'personalization', label: t('accentColor'), description: t('accentColorDesc'), keywords: 'color design',
            component: renderSettingRow(t('accentColor'), t('accentColorDesc'), (
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: `hsl(${ACCENT_COLORS[accentColor] || ACCENT_COLORS['Default']})` }} />
                    {renderDropdown(accentColor, Object.keys(ACCENT_COLORS || {}), (e) => setAccentColor(e.target.value), Palette)}
                </div>
            ))
        });

        // Data
        settings.push({
            id: 'chatHistory', tab: 'data', label: t('chatHistory'), description: t('chatHistoryDesc'), keywords: 'save toggle',
            component: renderSettingRow(t('chatHistory'), t('chatHistoryDesc'), renderToggle(personalizations.dataControls?.chatHistory === 'On', (val) => updatePersonalization('dataControls', { chatHistory: val ? 'On' : 'Off' })))
        });

        // Account
        settings.push({
            id: 'nickname', tab: 'account', label: t('displayName'), description: 'Change your display name', keywords: 'name profile',
            component: (
                <div className="flex flex-col gap-2 py-4 border-b border-gray-100 dark:border-white/5">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('displayName')}</label>
                    <div className="relative">
                        <input type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl p-3 text-sm outline-none focus:border-primary transition-all" />
                        <button onClick={handleSaveNickname} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-[10px] rounded-lg hover:opacity-90 transition-all font-bold">Save</button>
                    </div>
                </div>
            )
        });

        return settings;
    }, [theme, accentColor, language, personalizations, nicknameInput, user, t, languages, ACCENT_COLORS]);

    const renderContent = () => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const results = allSettings.filter(item => item.label.toLowerCase().includes(query) || (item.keywords && item.keywords.toLowerCase().includes(query)));
            return (
                <div className="space-y-4">
                    {results.map(item => <div key={item.id}>{item.component}</div>)}
                    {results.length === 0 && <div className="py-20 text-center opacity-50"><p>No results found for "{searchQuery}"</p></div>}
                </div>
            );
        }

        switch (activeTab) {
            case 'personalization':
                return <div className="space-y-2">{allSettings.filter(s => s.tab === 'personalization').map(s => <div key={s.id}>{s.component}</div>)}</div>;
            case 'notifications':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-xs font-bold text-gray-400">Inbox ({notifications.length})</h3>
                            {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-xs font-bold text-primary">Clear All</button>}
                        </div>
                        <div className="space-y-3 mt-4">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-border flex justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-sm">{n.title}</h4>
                                        <p className="text-xs text-subtext">{n.desc}</p>
                                    </div>
                                    <button onClick={() => deleteNotification(n.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            )) : <div className="py-20 text-center opacity-40"><p>No notifications</p></div>}
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-4">
                        {allSettings.filter(s => s.tab === 'data').map(s => <div key={s.id}>{s.component}</div>)}
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Chat History</h4>
                            <div className="space-y-2 pr-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {Object.keys(groupedSessions).length > 0 ? Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                                    <div key={date} className="border border-border rounded-xl bg-gray-50/50 dark:bg-zinc-800/30">
                                        <button onClick={() => setExpandedDate(expandedDate === date ? null : date)} className="w-full flex items-center justify-between p-3">
                                            <span className="text-xs font-bold">{date}</span>
                                            <ChevronDown size={14} className={`transition-transform ${expandedDate === date ? 'rotate-180' : ''}`} />
                                        </button>
                                        {expandedDate === date && (
                                            <div className="p-2 pt-0 space-y-1">
                                                {groupedSessions[date].map(s => (
                                                    <div key={s.sessionId} className="flex items-center justify-between p-2 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-xs group">
                                                        <span className="truncate flex-1">{s.title || "New Chat"}</span>
                                                        <button onClick={() => { window.location.href = `/dashboard/chat/${s.sessionId}`; onClose(); }} className="ml-2 px-2 py-1 bg-primary text-white rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">View</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )) : <p className="text-center py-10 opacity-50">No chats found</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase">Active Sessions</h4>
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.email} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{(acc.name || 'U').charAt(0).toUpperCase()}</div>
                                        <div>
                                            <p className="text-sm font-bold">{acc.name || 'User'}</p>
                                            <p className="text-[10px] text-subtext">{acc.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {acc.email !== user?.email && <button onClick={() => handleSwitchAccount(acc)} className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-lg font-bold">Switch</button>}
                                        <button onClick={() => handleAccountLogout(acc.email)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className="space-y-4">
                        {allSettings.filter(s => s.tab === 'account').map(s => <div key={s.id}>{s.component}</div>)}
                        <div className="py-4 flex justify-between items-center text-sm">
                            <div>
                                <p className="font-bold">Password</p>
                                <p className="text-xs text-subtext">Manage your account security</p>
                            </div>
                            <button onClick={() => setShowResetModal(true)} className="text-primary font-bold hover:underline">Change Password</button>
                        </div>
                    </div>
                );
            case 'credits':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Plan Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <Zap className="w-12 h-12 text-primary opacity-20" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Plan</h3>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <h2 className="text-3xl font-black text-maintext">{planName.replace(' Plan', '')}</h2>
                                    <span className="text-xs text-subtext font-medium">/ 1 Month</span>
                                </div>

                                <div className="flex items-center justify-between bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                    <div>
                                        <p className="text-[10px] font-bold text-subtext uppercase tracking-wider">Available Credits</p>
                                        <p className="text-2xl font-black text-primary">{user?.credits || 0}</p>
                                    </div>
                                    <button onClick={() => { window.location.href = '/pricing'; onClose(); }} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">Buy More</button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Usage */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Credit Usage</h4>
                                {loadingHistory && <RefreshCcw className="w-3 h-3 animate-spin text-primary" />}
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {creditLogs.length > 0 ? creditLogs.map(log => (
                                    <div key={log._id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl border border-border group hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.credits < 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                {log.credits < 0 ? <Zap size={14} /> : <CreditCard size={14} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[150px]">{log.description}</p>
                                                <p className="text-[10px] text-subtext">{new Date(log.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${log.credits < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {log.credits > 0 ? '+' : ''}{log.credits}
                                            </p>
                                            <p className="text-[10px] text-subtext">{log.balanceAfter} total</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-10 text-center opacity-40">
                                        <p className="text-sm">No credit history found yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full sm:max-w-[850px] h-full sm:h-[85vh] bg-white dark:bg-[#161B2E] flex flex-col sm:flex-row shadow-2xl sm:rounded-[2rem] overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className={`w-full sm:w-[240px] bg-gray-50 dark:bg-black/20 flex flex-col border-r border-gray-100 dark:border-white/5 ${view === 'detail' ? 'hidden sm:flex' : 'flex'}`}>
                        <div className="p-5 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Settings</h2>
                            <button onClick={onClose} className="sm:hidden text-subtext"><X size={20} /></button>
                        </div>

                        <div className="px-4 pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className="w-full bg-white dark:bg-white/5 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>

                        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setView('detail'); }} className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-xl text-sm transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[#1E2438] shadow-sm text-primary' : 'text-subtext hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                                    <tab.icon className="w-4 h-4" />
                                    <span className="font-bold">{tab.label}</span>
                                    <ChevronRight className="w-4 h-4 ml-auto sm:hidden opacity-50" />
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 space-y-1 border-t border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => { setActiveTab('credits'); setView('detail'); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 shadow-md shadow-cyan-500/20 mb-1"
                            >
                                <CreditCard className="w-4 h-4" /> ✦ Credits & Plans
                            </button>
                            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 font-bold transition-all"><LogOut className="w-4 h-4" /> {t('logOut')}</button>
                        </div>
                    </div>

                    <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#161B2E] overflow-hidden ${view === 'sidebar' ? 'hidden sm:flex' : 'flex'}`}>
                        <div className="px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-between border-b sm:border-b-0 border-gray-100 dark:border-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setView('sidebar')} className="sm:hidden p-1 hover:bg-black/5 rounded-full"><ChevronLeft size={24} /></button>
                                <h2 className="text-lg sm:text-xl font-bold">{searchQuery ? 'Search Results' : tabs.find(t => t.id === activeTab)?.label}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 sm:px-8 pb-10 custom-scrollbar">{renderContent()}</div>
                    </div>
                </motion.div>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowResetModal(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1E2438] p-6 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        {resetStep === 1 ? (
                            <button onClick={handleSendOtp} disabled={resetLoading} className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50">
                                {resetLoading ? 'Sending...' : 'Send OTP to Email'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <input type="text" placeholder="Enter OTP" value={resetOtp} onChange={e => setResetOtp(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
                                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none" />
                                <button onClick={handleResetPassword} disabled={resetLoading} className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
                                    {resetLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfileSettingsDropdown;
