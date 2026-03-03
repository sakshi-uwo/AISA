import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Bell, Sparkles, LayoutGrid,
    Database, Shield, Lock, User,
    X, ChevronDown, Play, Globe,
    LogOut, Monitor, Mic, Check,
    ChevronLeft, ChevronRight, Trash2, ShieldCheck, Mail, Volume2, Plus,
    Palette, Type, RefreshCcw, Languages, Crown, History, Calendar, CreditCard, Download, Search
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { usePersonalization } from '../../context/PersonalizationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getUserData, getAccounts, removeAccount, setUserData, updateUser, userData } from '../../userStore/userData';
import { useRecoilState } from 'recoil';
import toast from 'react-hot-toast';
import axios from 'axios';
import { apis } from '../../types';
import CustomSelect from '../CustomSelect/CustomSelect';
import PricingModal from '../Pricing/PricingModal';
import usePayment from '../../hooks/usePayment';
import { apiService } from '../../services/apiService';
import { useSubscription } from '../../context/SubscriptionContext';
import UsageStats from '../Subscription/UsageStats';

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
    const [isPlayingVoice, setIsPlayingVoice] = useState(false);
    const [accounts, setAccounts] = useState(getAccounts());
    const [nicknameInput, setNicknameInput] = useState('');
    const [showPricingModal, setShowPricingModal] = useState(false);
    const { handlePayment, loading: paymentLoading } = usePayment();
    const { refreshSubscription } = useSubscription();
    const [transactions, setTransactions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedDate, setExpandedDate] = useState(null);

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [resetStep, setResetStep] = useState(1); // 1: Send OTP, 2: Verify & Reset
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

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
        if (activeTab === 'account' && user?.token) {
            fetchTransactions();
            refreshSubscription(); // Force refresh subscription system data

            // Sync user profile to ensure plan is up to date
            axios.get(apis.user, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            }).then(res => {
                if (res.data) {
                    const mergedData = setUserData(res.data);
                    setUserRecoil(prev => ({ ...prev, user: mergedData }));
                }
            }).catch(err => console.error("Profile sync failed", err));
        }
    }, [activeTab, user?.token, refreshSubscription]);

    const fetchTransactions = async () => {
        try {
            setLoadingHistory(true);
            const res = await axios.get(apis.getPaymentHistory, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setTransactions(res.data.filter(tx => tx.amount > 0));
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const generateInvoice = (tx) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(63, 81, 181);
        doc.text("INVOICE", 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("AISA™ AI Platforms", 20, 40);
        doc.setFontSize(10);
        doc.text(`Invoice No: ${tx._id.substring(0, 8).toUpperCase()}`, 140, 40);
        doc.text(`Date: ${new Date(tx.createdAt).toLocaleDateString()}`, 140, 45);
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);
        doc.text("Bill To:", 20, 70);
        doc.text(user.name || "Customer", 20, 75);
        doc.text(user.email || "", 20, 80);
        doc.line(20, 120, 190, 120);
        doc.text("Total", 140, 130);
        doc.text(`INR ${tx.amount}`, 170, 130, { align: "right" });
        doc.save(`Invoice_${tx._id}.pdf`);
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
            const updatedUser = updateUser({ name: nicknameInput });
            setUserRecoil({ user: updatedUser });
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

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            const userId = user.id || user._id;
            if (!userId) throw new Error('User ID not found');
            await apiService.deleteUser(userId);
            toast.success('Account deleted successfully');
            localStorage.clear();
            window.location.href = '/login';
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
            setShowDeleteModal(false);
        }
    };

    const tabs = [
        { id: 'personalization', label: t('personalization'), icon: Sparkles },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'data', label: t('dataControls'), icon: Database },
        { id: 'security', label: t('security'), icon: Shield },
        { id: 'account', label: t('account'), icon: User },
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
            <CustomSelect
                value={value}
                options={options}
                onChange={onChange}
                icon={icon}
            />
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

    // Memoized Settings Data for Search & Rendering
    const allSettings = useMemo(() => {
        const settings = [];

        // 1. Personalization Settings
        settings.push({
            id: 'theme',
            tab: 'personalization',
            label: t('appearance'),
            description: t('appearanceDesc'),
            keywords: 'dark mode light mode system theme display color',
            component: renderSettingRow(t('appearance'), t('appearanceDesc'), renderDropdown(
                t(theme),
                [t('system'), t('dark'), t('light')],
                (e) => setTheme(e.target.value === t('system') ? 'system' : e.target.value === t('dark') ? 'dark' : 'light'),
                Monitor
            ))
        });

        settings.push({
            id: 'accent',
            tab: 'personalization',
            label: t('accentColor'),
            description: t('accentColorDesc'),
            keywords: 'color design brand purple blue green orange pink',
            component: renderSettingRow(t('accentColor'), t('accentColorDesc'), (
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: `hsl(${ACCENT_COLORS[accentColor] || ACCENT_COLORS['Default']})` }} />
                    {renderDropdown(accentColor, Object.keys(ACCENT_COLORS || {}), (e) => setAccentColor(e.target.value), Palette)}
                </div>
            ))
        });

        settings.push({
            id: 'language',
            tab: 'personalization',
            label: t('language'),
            description: t('languageDesc'),
            keywords: 'locale translate english hindi french spanish',
            component: renderSettingRow(t('language'), t('languageDesc'), renderDropdown(language, languages || ['English'], (e) => setLanguage(e.target.value), Languages))
        });

        settings.push({
            id: 'fontSize',
            tab: 'personalization',
            label: t('fontSize'),
            description: t('fontSizeDesc'),
            keywords: 'text size large small medium extra large',
            component: renderSettingRow(t('fontSize'), t('fontSizeDesc'), renderDropdown(
                t(personalizations.personalization?.fontSize === 'Extra Large' ? 'extraLarge' : (personalizations.personalization?.fontSize?.toLowerCase() || 'medium')),
                [t('medium'), t('large'), t('extraLarge')],
                (e) => {
                    const sizeMap = {
                        [t('medium')]: 'Medium',
                        [t('large')]: 'Large',
                        [t('extraLarge')]: 'Extra Large'
                    };
                    updatePersonalization('personalization', { fontSize: sizeMap[e.target.value] });
                },
                Type
            ))
        });

        settings.push({
            id: 'fontStyle',
            tab: 'personalization',
            label: t('fontStyle'),
            description: t('fontStyleDesc'),
            keywords: 'typography font family serif sans mono rounded',
            component: renderSettingRow(t('fontStyle'), t('fontStyleDesc'), renderDropdown(
                t(personalizations.personalization?.fontStyle?.toLowerCase() || 'default'),
                [t('default'), t('serif'), t('mono'), t('sans'), t('rounded')],
                (e) => {
                    const styleMap = { [t('default')]: 'Default', [t('serif')]: 'Serif', [t('mono')]: 'Mono', [t('sans')]: 'Sans', [t('rounded')]: 'Rounded' };
                    updatePersonalization('personalization', { fontStyle: styleMap[e.target.value] });
                },
                RefreshCcw
            ))
        });

        // 2. Data Settings
        settings.push({
            id: 'chatHistory',
            tab: 'data',
            label: t('chatHistory'),
            description: t('chatHistoryDesc'),
            keywords: 'save toggle privacy training',
            component: renderSettingRow(t('chatHistory'), t('chatHistoryDesc'), renderToggle(
                personalizations.dataControls?.chatHistory === 'On',
                (val) => updatePersonalization('dataControls', { chatHistory: val ? 'On' : 'Off' })
            ))
        });

        // 2b. Recent Chat History (Data)
        settings.push({
            id: 'chatHistoryList',
            tab: 'data',
            label: t('recentChatHistory') || 'Recent Chat History',
            description: 'View and manage your past conversations',
            keywords: 'past sessions conversations view open',
            component: (
                <div className="pt-4 animate-in fade-in duration-300">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">{t('recentChatHistory')}</h4>
                    <div className="space-y-2 pr-2">
                        {Object.keys(groupedSessions).length > 0 ? (
                            Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                                <div key={date} className="border border-gray-100 dark:border-white/5 rounded-xl">
                                    <button onClick={() => setExpandedDate(expandedDate === date ? null : date)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50">
                                        <span className="text-sm font-semibold">{date}</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedDate === date ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedDate === date && (
                                        <div className="p-2 space-y-1">
                                            {groupedSessions[date].map(session => (
                                                <div key={session.sessionId} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg">
                                                    <span className="text-sm truncate pr-4">{session.title || "New Chat"}</span>
                                                    <button onClick={() => { window.location.href = `/dashboard/chat/${session.sessionId}`; onClose(); }} className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded">View</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : <p className="text-center text-sm text-gray-500 py-10">No chats found</p>}
                    </div>
                </div>
            )
        });

        // 3. Account Settings
        settings.push({
            id: 'nickname',
            tab: 'account',
            label: t('displayName'),
            description: 'Change your display name',
            keywords: 'name profile identity edit update',
            component: (
                <div className="flex flex-col gap-2 py-4 border-b border-gray-100 dark:border-white/5">
                    <label className="text-xs font-bold text-gray-500 uppercase">{t('displayName')}</label>
                    <div className="relative">
                        <input type="text" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-800 border rounded-xl p-3 text-sm" />
                        <button onClick={handleSaveNickname} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-[10px] rounded-lg">Save</button>
                    </div>
                </div>
            )
        });

        settings.push({
            id: 'password',
            tab: 'account',
            label: 'Password',
            description: 'Reset your password',
            keywords: 'login access forgot reset change secure',
            component: (
                <div className="flex flex-col gap-2 py-4 border-b border-gray-100 dark:border-white/5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('loginId')}</span>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[14px]">
                        <span className="text-gray-600 dark:text-gray-400 break-all min-w-0 flex-1">{user?.email}</span>
                        <button onClick={() => setShowResetModal(true)} className="text-primary font-bold hover:underline whitespace-nowrap">Forgot Password?</button>
                    </div>
                </div>
            )
        });

        settings.push({
            id: 'plan',
            tab: 'account',
            label: 'Subscription Plan',
            description: 'Manage your subscription',
            keywords: 'upgrade billing pro max ultra payment usage limits',
            component: (
                <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-primary/20 mt-4">
                        <div className="min-w-[120px]">
                            <p className="font-bold text-[16px] capitalize text-primary">{user?.plan || 'Basic'} Plan</p>
                            <p className="text-[11px] text-gray-500">Your current subscription</p>
                        </div>
                        <button onClick={() => setIsUpgradeModalOpen(true)} className="px-5 py-2.5 bg-primary text-white text-[12px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95 whitespace-nowrap">Upgrade Plan</button>
                    </div>

                    {/* Integrated Usage Stats Card */}
                    <UsageStats />
                </div>
            )
        });

        // 3b. Transaction History (Account)
        settings.push({
            id: 'transactions',
            tab: 'account',
            label: 'Transaction History',
            description: 'View your payment history',
            keywords: 'invoice receipt download billing payments',
            component: (
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                    <button onClick={() => setShowHistory(!showHistory)} className="text-sm text-primary font-semibold flex items-center gap-2"><History className="w-4 h-4" /> Transaction History</button>
                    {showHistory && (
                        <div className="mt-4 space-y-2">
                            {transactions.length > 0 ? transactions.map(tx => (
                                <div key={tx._id} className="flex justify-between p-3 bg-gray-50 rounded-lg text-sm">
                                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                    <span className="font-bold">₹{tx.amount}</span>
                                    <button onClick={() => generateInvoice(tx)} className="text-primary"><Download className="w-4 h-4" /></button>
                                </div>
                            )) : <p className="text-center text-xs text-gray-400 py-4">No transactions found</p>}
                        </div>
                    )}
                </div>
            )
        });

        // 4. Notifications
        settings.push({
            id: 'notifications',
            tab: 'notifications',
            label: t('notifications') || 'Notifications',
            description: 'View your latest alerts and messages',
            keywords: 'inbox alerts messages clear all delete remove',
            component: (
                <div className="space-y-4 animate-in fade-in duration-300 py-2">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('inbox')} ({notifications.length})</h3>
                        {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-xs font-semibold text-primary">{t('clearAllNotifications')}</button>}
                    </div>
                    <div className="space-y-3">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div key={notif.id} className="group p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5 relative">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex flex-col gap-1">
                                            <h4 className="text-[15px] font-bold">{notif.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{notif.desc}</p>
                                            <span className="text-[11px] text-gray-400">{new Date(notif.time).toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => deleteNotification(notif.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-60">
                                <Bell className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                                <h4 className="font-bold">{t('youreAllCaughtUp')}</h4>
                            </div>
                        )}
                    </div>
                </div>
            )
        });

        // 5. Security
        settings.push({
            id: 'security',
            tab: 'security',
            label: t('security') || 'Security',
            description: 'Manage active sessions and account security',
            keywords: 'sessions login devices logout switch account',
            component: (
                <div className="space-y-4 animate-in fade-in duration-300 py-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('activeSessions')}</h4>
                    <div className="space-y-3">
                        {accounts.map((acc) => (
                            <div key={acc.email} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                        {(acc.avatar || (acc.email === user.email && user.avatar)) ? (
                                            <img src={acc.avatar || user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-primary font-bold text-sm">{(acc.name || 'U').charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{acc.name || 'User'}</p>
                                        <p className="text-[11px] text-gray-500">{acc.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {acc.email !== user?.email && <button onClick={() => handleSwitchAccount(acc)} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg">Switch</button>}
                                    <button onClick={() => handleAccountLogout(acc.email)} className="p-2 text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        });

        // 6. Log Out (Global - Search Only)
        settings.push({
            id: 'logout_global',
            tab: 'none', // Set to none so it doesn't show in any tab normally, but keyword search still works
            label: t('logOut'),
            description: 'Sign out of your account',
            keywords: 'sign out exit leave logout toggle',
            component: (
                <div className="py-4 border-t border-gray-100 dark:border-white/5 mt-2">
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-500 text-sm px-4 py-3 w-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors font-bold">
                        <LogOut className="w-4 h-4" /> {t('logOut')}
                    </button>
                </div>
            )
        });

        return settings;
    }, [theme, accentColor, language, personalizations, nicknameInput, user, t, languages, ACCENT_COLORS, notifications, accounts, groupedSessions, expandedDate, showHistory, transactions, showResetModal]);

    const renderContent = () => {
        // Search View
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();

            const results = allSettings.filter(item => {
                // 1. Match Item Label or Description
                const itemMatch = item.label.toLowerCase().includes(query) ||
                    (item.description && item.description.toLowerCase().includes(query));

                // 2. Match Category Name (Tab Label)
                const tabLabel = tabs.find(t => t.id === item.tab)?.label.toLowerCase();
                const categoryMatch = tabLabel && tabLabel.includes(query);

                // 3. Match Keywords (Actions)
                const keywordMatch = item.keywords && item.keywords.toLowerCase().includes(query);

                return itemMatch || categoryMatch || keywordMatch;
            });

            return (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search Results ({results.length})</h3>
                    </div>

                    {results.length > 0 ? (
                        results.map(item => (
                            <div key={item.id}>
                                {item.component}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <Search className="w-10 h-10 mb-2" />
                            <p>No settings found for "{searchQuery}"</p>
                            <p className="text-xs text-center mt-2 max-w-[200px]">Try searching for "Dark Mode", "Upgrade", "Invoice", or "Log Out"</p>
                        </div>
                    )}
                </div>
            );
        }

        switch (activeTab) {
            case 'personalization':
                return (
                    <div className="space-y-2 animate-in fade-in duration-300">
                        {allSettings.filter(s => s.tab === 'personalization').map(s => <div key={s.id}>{s.component}</div>)}
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between pb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('inbox')} ({notifications.length})</h3>
                            {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-xs font-semibold text-primary">{t('clearAllNotifications')}</button>}
                        </div>
                        <div className="space-y-3">
                            {notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif.id} className="group p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-white/5 relative">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="text-[15px] font-bold">{notif.title}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{notif.desc}</p>
                                                <span className="text-[11px] text-gray-400">{new Date(notif.time).toLocaleString()}</span>
                                            </div>
                                            <button onClick={() => deleteNotification(notif.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-60">
                                    <Bell className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                                    <h4 className="font-bold">{t('youreAllCaughtUp')}</h4>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {allSettings.filter(s => s.tab === 'data').map(s => <div key={s.id}>{s.component}</div>)}
                        <div className="pt-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">{t('recentChatHistory')}</h4>
                            <div className="space-y-2 pr-2">
                                {Object.keys(groupedSessions).length > 0 ? (
                                    Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                                        <div key={date} className="border border-gray-100 dark:border-white/5 rounded-xl">
                                            <button onClick={() => setExpandedDate(expandedDate === date ? null : date)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50">
                                                <span className="text-sm font-semibold">{date}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${expandedDate === date ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expandedDate === date && (
                                                <div className="p-2 space-y-1">
                                                    {groupedSessions[date].map(session => (
                                                        <div key={session.sessionId} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg">
                                                            <span className="text-sm truncate pr-4">{session.title || "New Chat"}</span>
                                                            <button onClick={() => { window.location.href = `/dashboard/chat/${session.sessionId}`; onClose(); }} className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded">View</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : <p className="text-center text-sm text-gray-500 py-10">No chats found</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('activeSessions')}</h4>
                        <div className="space-y-3">
                            {accounts.map((acc) => (
                                <div key={acc.email} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                            {(acc.avatar || (acc.email === user.email && user.avatar)) ? (
                                                <img src={acc.avatar || user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-primary font-bold text-sm">{(acc.name || 'U').charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{acc.name || 'User'}</p>
                                            <p className="text-[11px] text-gray-500">{acc.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {acc.email !== user?.email && <button onClick={() => handleSwitchAccount(acc)} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-lg">Switch</button>}
                                        <button onClick={() => handleAccountLogout(acc.email)} className="p-2 text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-4">
                            {allSettings.filter(s => s.tab === 'account').map(s => <div key={s.id}>{s.component}</div>)}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return createPortal(
        <AnimatePresence>
            {!showPricingModal && (
                <div key="settings-main-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full sm:max-w-[850px] h-full sm:h-[85vh] bg-white dark:bg-[#161B2E] flex flex-col sm:flex-row shadow-2xl sm:rounded-[2rem] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className={`w-full sm:w-[240px] bg-gray-50 dark:bg-black/20 flex-col border-r border-gray-100 dark:border-white/5 ${view === 'detail' ? 'hidden sm:flex' : 'flex'}`}>
                            <div className="p-5 flex justify-between items-center">
                                <h2 className="text-lg font-bold">Settings</h2>
                                <button onClick={onClose} className="sm:hidden p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
                            </div>

                            {/* Search Bar */}
                            <div className="px-4 pb-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                                {searchQuery ? (
                                    <div className="px-2">
                                        {renderContent()}
                                    </div>
                                ) : (
                                    <>
                                        {tabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => {
                                                    setActiveTab(tab.id);
                                                    setView('detail');
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-xl text-sm transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-[#1E2438] shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                <tab.icon className="w-4 h-4" />
                                                {tab.label}
                                                <ChevronRight className="w-4 h-4 ml-auto sm:hidden opacity-50" />
                                            </button>
                                        ))}
                                    </>
                                )}
                            </nav>
                            <div className="p-4 space-y-1 border-t border-gray-100 dark:border-white/5">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium text-left"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('logOut')}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium text-left"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                        <div className={`flex-1 flex-col min-w-0 bg-white dark:bg-[#161B2E] overflow-hidden ${view === 'sidebar' ? 'hidden sm:flex' : 'flex'}`}>
                            <div className="px-5 py-4 sm:px-8 sm:py-6 border-b sm:border-b-0 border-gray-100 dark:border-white/5 flex items-center gap-3 shrink-0">
                                <button onClick={() => setView('sidebar')} className="sm:hidden p-1 -ml-1 hover:bg-black/5 rounded-full">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <h2 className="text-lg sm:text-xl font-bold">
                                    {searchQuery ? 'Search Results' : tabs.find(t => t.id === activeTab)?.label}
                                </h2>
                                <button onClick={onClose} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 sm:px-8 pb-20 custom-scrollbar">{renderContent()}</div>
                        </div>
                    </motion.div>
                </div>
            )}
            {showResetModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowResetModal(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-[#1E2438] p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Reset Password</h3>
                        {resetStep === 1 ? (
                            <button
                                key="btn-send-otp-aisa"
                                onClick={handleSendOtp}
                                disabled={resetLoading}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {resetLoading ? 'Sending...' : 'Send OTP'}
                            </button>
                        ) : (
                            <form
                                key="reset-password-form-final"
                                onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}
                                className="space-y-4 text-left"
                                autoComplete="off"
                            >
                                <div className="space-y-1">
                                    <label htmlFor="aisa-reset-otp-field" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Verification Code</label>
                                    <input
                                        type="text"
                                        id="aisa-reset-otp-field"
                                        name="aisa_otp_field_unique"
                                        autoComplete="off"
                                        value={resetOtp}
                                        onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        className="w-full border dark:border-white/10 dark:bg-white/5 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-center text-xl tracking-[0.5em] font-black"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="aisa-reset-password-field" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password"
                                        id="aisa-reset-password-field"
                                        name="aisa_new_password_field_unique"
                                        autoComplete="off"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full border dark:border-white/10 dark:bg-white/5 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {resetLoading ? 'Processing...' : 'Reset Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResetStep(1)}
                                    className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mt-2"
                                >
                                    Resend Code?
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-[#1E2438] p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Delete Account?</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            This action is permanent and cannot be undone. All your data, chats, and subscriptions will be deleted forever.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-white/5 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfileSettingsDropdown;
