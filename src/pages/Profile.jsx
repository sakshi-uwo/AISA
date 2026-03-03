import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CircleUser,
    Settings2,
    Shield,
    Clock,
    Star,
    Infinity,
    ChevronRight,
    LogOut,
    Camera,
    Pencil,
    Check,
    Bell,
    Lock,
    Trash2,
    Eye,
    EyeOff,
    X,
    Moon,
    Sun,
    Globe,
    CreditCard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppRoute, apis } from '../types';
import axios from 'axios';
import { getUserData, clearUser, setUserData, userData, toggleState } from '../userStore/userData';
import { useRecoilState } from 'recoil';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import MemoryManager from '../Components/MemoryManager';
import { useSubscription } from '../context/SubscriptionContext';

const Profile = () => {
    const navigate = useNavigate();
    const user = getUserData() || { name: 'Gauhar', email: 'gauhar@example.com' };

    // Settings State
    const [userSettings, setUserSettings] = React.useState(() => {
        const saved = localStorage.getItem('user_settings');
        return saved ? JSON.parse(saved) : {
            emailNotif: true,
            pushNotif: true,
            publicProfile: true,
            twoFactor: true
        };
    });
    const [mobileSection, setMobileSection] = React.useState(null);

    // Fetch latest settings from backend
    React.useEffect(() => {
        const fetchSettings = async () => {
            if (!user?.token) return;
            try {
                const res = await axios.get(apis.user, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.data) {
                    // Update user settings
                    if (res.data.settings) {
                        setUserSettings(res.data.settings);
                        localStorage.setItem('user_settings', JSON.stringify(res.data.settings));
                    }

                    // Update main user data (to sync plan, name, etc.)
                    const updatedUser = { ...user, ...res.data };
                    setUserData(updatedUser);
                    setUserRecoil({ user: updatedUser });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            }
        };
        fetchSettings();
    }, []); // Only on mount

    // Password Modal State
    const [showPasswordModal, setShowPasswordModal] = React.useState(false);
    const [passwordForm, setPasswordForm] = React.useState({ current: '', new: '', confirm: '' });
    const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [payments, setPayments] = React.useState([]);
    const [isPaymentsLoading, setIsPaymentsLoading] = React.useState(true);
    const [showTransactionsModal, setShowTransactionsModal] = React.useState(false);

    React.useEffect(() => {
        const fetchPayments = async () => {
            if (!user?.token) return;
            try {
                const res = await axios.get(apis.getPaymentHistory, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                setPayments(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Failed to fetch payments", error);
            } finally {
                setIsPaymentsLoading(false);
            }
        };
        fetchPayments();
    }, [user?.token]);

    const toggleSetting = async (key) => {
        const oldSettings = { ...userSettings };
        const newState = { ...userSettings, [key]: !userSettings[key] };

        setUserSettings(newState);
        localStorage.setItem('user_settings', JSON.stringify(newState));

        const value = newState[key] ? "Enabled" : "Disabled";
        const labelMap = {
            emailNotif: "Email Notifications",
            pushNotif: "Push Notifications",
            publicProfile: "Public Profile",
            twoFactor: "Two-Factor Authentication"
        };
        toast.success(`${labelMap[key]} ${value}`);

        try {
            if (user?.token) {
                await axios.put(apis.user, { settings: newState }, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
            }
        } catch (error) {
            console.error("Failed to save setting", error);
            toast.error("Failed to save setting");
            setUserSettings(oldSettings);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error("New passwords do not match!");
            return;
        }
        if (passwordForm.new.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        const loadingToast = toast.loading("Updating password...");
        try {
            await axios.post(apis.resetPasswordEmail, {
                email: user.email,
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
            });
            toast.dismiss(loadingToast);
            toast.success("Password updated successfully!");
            setShowPasswordModal(false);
            setPasswordForm({ current: '', new: '', confirm: '' });
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || "Failed to update password.");
        }
    };

    const handleLogout = () => {
        clearUser();
        navigate(AppRoute.LANDING);
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("Are you SURE you want to delete your account? This action is permanent and will delete all your chats and data.");
        if (!confirmDelete) return;

        const loadingToast = toast.loading("Deleting account...");
        try {
            if (!user?.id || !user?.token) {
                toast.error("User ID or token missing.");
                toast.dismiss(loadingToast);
                return;
            }

            await axios.delete(`${apis.user}/${user.id}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            toast.dismiss(loadingToast);
            toast.success("Account deleted successfully.");

            // Cleanup and Logout
            clearUser();
            navigate(AppRoute.LANDING);
            window.location.reload(); // Ensure all state is cleared
        } catch (error) {
            toast.dismiss(loadingToast);
            console.error("Failed to delete account", error);
            toast.error(error.response?.data?.error || "Failed to delete account. Please try again.");
        }
    };

    const { language, setLanguage, t, region, setRegion, regions, regionFlags, allTimezones, regionTimezones } = useLanguage();
    const { theme, setTheme } = useTheme();

    const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState({ name: user.name, email: user.email });

    const [currentUserData, setUserRecoil] = useRecoilState(userData);

    const handleSaveProfile = async () => {
        const loadingToast = toast.loading("Updating profile...");
        try {
            const updatedUser = { ...user, name: editForm.name };

            // 1. Update Backend
            if (user?.token) {
                await axios.put(apis.user, { name: editForm.name }, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
            }

            // 2. Update Local Storage
            setUserData(updatedUser);

            // 3. Update Recoil Atom (Triggers Sidebar update)
            setUserRecoil(prev => ({ ...prev, user: updatedUser }));

            setIsEditing(false);
            toast.dismiss(loadingToast);
            toast.success("Profile updated successfully!");

        } catch (error) {
            console.error("Failed to update profile", error);
            toast.dismiss(loadingToast);

            // Revert changes if needed or show error
            toast.error("Failed to save changes to server.");

            // Optional: If backend fails, we might want to revert the local change? 
            // For now, we'll assume the user wants to keep their edit locally or try again.
        }
    };

    const [preferences, setPreferences] = React.useState({
        timezone: regionTimezones[region] || 'India (GMT+5:30)',
        currency: 'INR (₹)'
    });

    // Update timezone when region changes
    React.useEffect(() => {
        if (regionTimezones[region]) {
            setPreferences(prev => ({ ...prev, timezone: regionTimezones[region] }));
        }
    }, [region]);

    const [activeSection, setActiveSection] = React.useState(null);
    const [selectionMode, setSelectionMode] = React.useState('language'); // 'language' or 'region'

    const location = useLocation();

    // Automatically open language section if navigated from Sidebar indicator
    React.useEffect(() => {
        if (location.state?.openLanguage) {
            setActiveSection('language');
            setSelectionMode('language');
        }
        if (location.state?.activeTab === 'personalization' || location.state?.activeTab === 'general') {
            const preferencesSection = document.getElementById('preferences-section');
            if (preferencesSection) {
                preferencesSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        if (location.state?.activeTab === 'notifications') {
            const notificationsSection = document.getElementById('notifications-section');
            if (notificationsSection) {
                notificationsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        if (location.state?.activeTab === 'security') {
            const securitySection = document.getElementById('security-section');
            if (securitySection) {
                securitySection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location.state]);

    const currencies = ["USD ($)", "EUR (€)", "GBP (£)", "INR (₹)", "JPY (¥)", "CNY (¥)", "AUD (A$)", "CAD (C$)"];

    const handlePreferenceClick = (key) => {
        setActiveSection(activeSection === key ? null : key);
        if (key === 'language') setSelectionMode('language');
    };

    const nativeLanguageNames = {
        "English": "English - EN",
        "Hindi": "हिन्दी - HI",
        "Tamil": "தமிழ் - TA",
        "Telugu": "తెలుగు - TE",
        "Kannada": "ಕನ್ನಡ - KN",
        "Malayalam": "മലയാളം - ML",
        "Bengali": "বাংলা - BN",
        "Marathi": "मराठी - MR",
        "Urdu": "اردو - UR",
        "Mandarin Chinese": "中文 (简体) - ZH",
        "Spanish": "Español - ES",
        "French": "Français - FR",
        "German": "Deutsch - DE",
        "Japanese": "日本語 - JA",
        "Portuguese": "Português - PT",
        "Arabic": "العربية - AR",
        "Korean": "한국어 - KO",
        "Italian": "Italiano - IT",
        "Russian": "Русский - RU",
        "Turkish": "Türkçe - TR",
        "Dutch": "Nederlands - NL"
    };

    const getNativeName = (lang) => nativeLanguageNames[lang] || lang;

    const { plan_name, remaining_credits, total_credits, usageHistory } = useSubscription();

    const stats = [
        { label: t('totalSessions'), value: usageHistory?.length || '0', icon: Clock, color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Current Plan', value: plan_name || 'FREE', icon: Star, color: 'bg-sky-400/10 text-sky-600', clickable: true },
        { label: t('accountSettings'), value: 'Configured', icon: Settings2, color: 'bg-purple-500/10 text-purple-600' },
        { label: t('credits'), value: `${remaining_credits} / ${total_credits}`, icon: Shield, color: 'bg-green-500/10 text-green-600' }
    ];

    const preferenceItems = [
        {
            key: 'language',
            label: 'Country/Region & Language',
            value: (
                <div className="flex items-center gap-2">
                    <img src={getFlagUrl(regionFlags[region] || 'us')} alt={region} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                    <span>{region} ({language})</span>
                </div>
            )
        },
        { key: 'theme', label: 'Display Theme', value: theme },
        { key: 'timezone', label: t('timezone'), value: preferences.timezone },
        { key: 'currency', label: t('currency'), value: preferences.currency }
    ];

    const PreferencesContent = (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-maintext flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" />{t.accountPreferences}</h2>
            <div className="space-y-4">
                {preferenceItems.map((item) => (
                    <div key={item.key} className={`relative ${activeSection === item.key ? 'z-20' : 'z-0'}`}>
                        <div onClick={() => handlePreferenceClick(item.key)} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30 px-2 rounded-lg transition-colors cursor-pointer group">
                            <span className="text-sm font-medium text-subtext">{item.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-maintext">{item.value}</span>
                                <ChevronRight className={`w-4 h-4 text-subtext group-hover:text-primary transition-colors ${activeSection === item.key ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {/* Language Dropdown */}
                        {item.key === 'language' && activeSection === 'language' && (
                            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="md:absolute md:top-full md:left-0 md:right-0 md:mt-2 fixed left-4 right-4 top-1/2 -translate-y-1/2 md:translate-y-0 z-[100] md:z-50 bg-card border border-border rounded-3xl md:rounded-2xl shadow-2xl md:shadow-xl overflow-hidden p-4 md:p-4 min-w-[280px]">
                                {selectionMode === 'language' ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h3 className="text-sm font-bold text-maintext">Change Language</h3>
                                            <button onClick={() => setActiveSection(null)} className="md:hidden p-1 bg-secondary rounded-full"><X className="w-4 h-4 text-subtext" /></button>
                                        </div>
                                        <div className="space-y-1 max-h-[50vh] md:max-h-60 overflow-y-auto custom-scrollbar">
                                            {regions[region]?.map(lang => (
                                                <button
                                                    key={lang}
                                                    onClick={() => { setLanguage(lang); setActiveSection(null); }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${language === lang ? 'bg-sky-400/10 text-sky-600' : 'text-maintext hover:bg-secondary'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${language === lang ? 'border-sky-400' : 'border-border group-hover:border-subtext'}`}>
                                                        {language === lang && <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm" />}
                                                    </div>
                                                    {getNativeName(lang)}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="pt-3 border-t mt-3">
                                            <div className="flex items-center justify-between px-1 mb-3">
                                                <div className="flex items-center gap-2 text-xs text-subtext">
                                                    <img src={getFlagUrl(regionFlags[region] || 'us')} className="w-4 h-3 object-cover rounded-sm shadow-sm border border-border/50" alt="" />
                                                    <span>Shopping in <b>{region}</b></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectionMode('region')}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-primary font-bold text-xs hover:bg-primary/5 transition-all group"
                                            >
                                                <span>Change country/region</span>
                                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button onClick={() => setSelectionMode('language')} className="p-1 hover:bg-secondary rounded-lg"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                                            <h3 className="text-sm font-bold text-maintext">Select Country/Region</h3>
                                        </div>
                                        <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                            {Object.keys(regions).map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => { setRegion(r); setSelectionMode('language'); }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${region === r ? 'bg-primary/10 text-primary' : 'text-maintext hover:bg-secondary'}`}
                                                >
                                                    <img src={getFlagUrl(regionFlags[r] || 'us')} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" alt="" />
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Theme Dropdown */}
                        {item.key === 'theme' && activeSection === 'theme' && (
                            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="md:absolute md:top-full md:left-0 md:right-0 md:mt-2 fixed left-4 right-4 top-1/2 -translate-y-1/2 md:translate-y-0 z-[100] md:z-50 bg-card border border-border rounded-3xl md:rounded-2xl shadow-2xl md:shadow-xl overflow-hidden p-2 md:p-0">
                                <div className="flex justify-between items-center px-4 py-3 md:hidden border-b border-border mb-1">
                                    <h3 className="text-sm font-bold text-maintext">Display Theme</h3>
                                    <button onClick={() => setActiveSection(null)} className="p-1 bg-secondary rounded-full"><X className="w-4 h-4 text-subtext" /></button>
                                </div>
                                {['Light', 'Dark'].map(mode => (
                                    <button key={mode} onClick={() => { setTheme(mode); setActiveSection(null); }} className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-primary/5 hover:text-primary transition-colors flex justify-between items-center ${theme === mode ? 'bg-primary/5 text-primary' : 'text-maintext'}`}>
                                        <span className="flex items-center gap-2">{mode === 'Light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{mode} Mode</span>
                                        {theme === mode && <Star className="w-3 h-3 fill-primary" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Timezone Dropdown */}
                        {item.key === 'timezone' && activeSection === 'timezone' && (
                            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="md:absolute md:top-full md:left-0 md:right-0 md:mt-2 fixed left-4 right-4 top-1/2 -translate-y-1/2 md:translate-y-0 z-[100] md:z-50 bg-card border border-border rounded-3xl md:rounded-2xl shadow-2xl md:shadow-xl overflow-hidden min-w-[280px] md:min-w-[300px]">
                                <div className="p-3 bg-secondary/30 border-b border-border flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-subtext uppercase">Select Timezone</h3>
                                    <button onClick={() => setActiveSection(null)} className="md:hidden p-1 bg-secondary rounded-full"><X className="w-4 h-4 text-subtext" /></button>
                                </div>
                                <div className="max-h-[50vh] md:max-h-60 overflow-y-auto custom-scrollbar">
                                    {allTimezones.map(tz => (
                                        <button
                                            key={tz}
                                            onClick={() => {
                                                setPreferences(prev => ({ ...prev, timezone: tz }));
                                                setActiveSection(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex justify-between items-center ${preferences.timezone === tz ? 'bg-primary/5 text-primary' : 'hover:bg-primary/5 text-maintext hover:text-primary'}`}
                                        >
                                            <span>{tz}</span>
                                            {preferences.timezone === tz && (
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Currency Dropdown */}
                        {item.key === 'currency' && activeSection === 'currency' && (
                            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="md:absolute md:top-full md:left-0 md:right-0 md:mt-2 fixed left-4 right-4 top-1/2 -translate-y-1/2 md:translate-y-0 z-[100] md:z-50 bg-card border border-border rounded-3xl md:rounded-2xl shadow-2xl md:shadow-xl overflow-hidden">
                                <div className="p-3 bg-secondary/30 border-b border-border flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-subtext uppercase">Select Currency</h3>
                                    <button onClick={() => setActiveSection(null)} className="md:hidden p-1 bg-secondary rounded-full"><X className="w-4 h-4 text-subtext" /></button>
                                </div>
                                <div className="max-h-[50vh] md:max-h-60 overflow-y-auto custom-scrollbar">
                                    {currencies.map(curr => (
                                        <button
                                            key={curr}
                                            onClick={() => {
                                                setPreferences(prev => ({ ...prev, currency: curr }));
                                                setActiveSection(null);
                                            }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex justify-between items-center ${preferences.currency === curr ? 'bg-primary/5 text-primary' : 'hover:bg-primary/5 text-maintext hover:text-primary'}`}
                                        >
                                            <span>{curr}</span>
                                            {preferences.currency === curr && (
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const NotificationsContent = (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-maintext flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" />Notifications</h2>
            <div className="space-y-4">
                {['emailNotif', 'pushNotif'].map(k => (
                    <div key={k} className="flex items-center justify-between">
                        <div><p className="text-sm font-bold text-maintext">{k === 'emailNotif' ? 'Email Notifications' : 'Push Notifications'}</p><p className="text-xs text-subtext">Receive updates</p></div>
                        <button onClick={() => toggleSetting(k)} className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${userSettings[k] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${userSettings[k] ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const SecurityContent = (
        <div className="space-y-6 flex flex-col h-full">
            <h2 className="text-xl font-bold text-maintext flex items-center gap-2"><Lock className="w-5 h-5 text-green-500" />{t.securityStatus}</h2>
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-500/5 border border-border rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                        <p className="text-sm font-bold text-maintext">Strong Protection</p>
                        <div className="text-xs text-green-500 font-bold flex items-center gap-1"><Check className="w-3 h-3" /> System Secure</div>
                    </div>
                    <div className="ml-auto text-2xl font-black text-green-500">98%</div>
                </div>
                <div className="p-4 bg-secondary/30 rounded-2xl space-y-3">
                    <div className="flex justify-between text-xs font-bold text-subtext"><span>Password Strength</span><span className="text-primary">Excellent</span></div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="w-[90%] h-full bg-gradient-to-r from-primary to-purple-500" /></div>
                </div>
                <button onClick={() => setShowPasswordModal(true)} className="w-full p-4 bg-secondary/50 rounded-2xl border border-border hover:bg-secondary transition-colors text-left group">
                    <p className="text-xs text-subtext mb-1">Password</p>
                    <div className="flex justify-between items-center"><span className="text-sm font-bold text-maintext">Change Password</span><ChevronRight className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" /></div>
                </button>
            </div>

            {/* Payment History Button */}
            <div className="pt-4">
                <button
                    onClick={() => setShowTransactionsModal(true)}
                    className="w-full p-4 bg-secondary/50 rounded-2xl border border-border hover:bg-secondary transition-colors text-left group"
                >
                    <p className="text-xs text-subtext mb-1">Billing</p>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-bold text-maintext">Transaction History</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                    </div>
                </button>
            </div>

            <div className="mt-auto pt-6 space-y-3">
                <button onClick={handleLogout} className="w-full py-4 bg-red-500/5 text-red-600 border border-red-500/10 rounded-2xl font-bold text-sm hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"><LogOut className="w-4 h-4" />LogOut</button>
                <button onClick={handleDeleteAccount} className="w-full py-4 bg-red-500/5 text-red-600 border border-red-500/10 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Delete Account</button>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-secondary p-4 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-6 bg-card border border-border p-6 md:p-8 rounded-[32px] shadow-sm relative overflow-hidden">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner overflow-hidden text-2xl md:text-3xl font-bold shrink-0">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerText = user.name ? user.name.charAt(0).toUpperCase() : "U";
                                }}
                            />
                        ) : (
                            user.name ? user.name.charAt(0).toUpperCase() : <CircleUser className="w-10 h-10 md:w-12 md:h-12" />
                        )}
                    </div>

                    <div className="text-center md:text-left space-y-1 flex-1 w-full md:w-auto">
                        {isEditing ? (
                            <div className="space-y-3 max-w-md mx-auto md:mx-0">
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full text-xl md:text-2xl font-bold bg-secondary/50 border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-maintext text-center md:text-left"
                                />
                                <div className="flex gap-2 justify-center md:justify-start">
                                    <button onClick={handleSaveProfile} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                        <Check className="w-4 h-4" /> Save
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-surface text-maintext border border-border rounded-lg text-sm font-bold flex items-center gap-2">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="group relative inline-flex items-center gap-3 justify-center md:justify-start">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-black text-maintext truncate max-w-[200px] md:max-w-none">{user.name}</h1>
                                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                        {!isEditing && <p className="text-subtext font-medium text-sm md:text-base">{user.email}</p>}
                    </div>
                </div>

                {/* AI Memory Manager */}
                <MemoryManager />

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => stat.clickable && setTglState(prev => ({ ...prev, platformSubTgl: true }))}
                            className={`bg-card border border-border p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group ${stat.clickable ? 'cursor-pointer' : ''}`}
                        >
                            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}><stat.icon className="w-5 h-5" /></div>
                            <p className="text-xs font-bold text-subtext uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="text-xl font-black text-maintext">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>



                {/* Account Details & Settings */}

                {/* Mobile Menu (Visible only on mobile) */}
                <div className="md:hidden space-y-3 mt-6">
                    <button onClick={() => setMobileSection('preferences')} className="w-full bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Settings2 className="w-5 h-5" /></div>
                            <span className="font-bold text-maintext">Account Preferences</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-subtext" />
                    </button>
                    <button onClick={() => setMobileSection('notifications')} className="w-full bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><Bell className="w-5 h-5" /></div>
                            <span className="font-bold text-maintext">Notifications</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-subtext" />
                    </button>
                    <button onClick={() => setMobileSection('security')} className="w-full bg-card border border-border p-4 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"><Lock className="w-5 h-5" /></div>
                            <span className="font-bold text-maintext">Security & Login</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-subtext" />
                    </button>
                </div>

                {/* Desktop Grid (Hidden on mobile) */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    <div id="preferences-section" className="bg-card border border-border rounded-[32px] p-8 space-y-8">
                        {PreferencesContent}
                        <div className="pt-6 border-t border-border">
                            {NotificationsContent}
                        </div>
                    </div>

                    <div id="security-section" className="bg-card border border-border rounded-[32px] p-8 flex flex-col justify-between">
                        {SecurityContent}
                    </div>
                </div>

                {/* Mobile Section Modals */}
                <AnimatePresence>
                    {mobileSection && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden flex items-end sm:items-center justify-center"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setMobileSection(null);
                            }}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-card w-full h-[85vh] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl relative"
                            >
                                <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card z-10">
                                    <h3 className="text-lg font-bold text-maintext">
                                        {mobileSection === 'preferences' && 'Account Preferences'}
                                        {mobileSection === 'notifications' && 'Notifications'}
                                        {mobileSection === 'security' && 'Security & Login'}
                                    </h3>
                                    <button onClick={() => setMobileSection(null)} className="p-2 bg-secondary rounded-full hover:bg-border/50 transition-colors">
                                        <X className="w-5 h-5 text-maintext" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-10">
                                    {mobileSection === 'preferences' && PreferencesContent}
                                    {mobileSection === 'notifications' && NotificationsContent}
                                    {mobileSection === 'security' && SecurityContent}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Transaction History Modal */}
                <AnimatePresence>
                    {activeSection && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveSection(null)}
                            className="md:hidden fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
                        />
                    )}

                    {showTransactionsModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowTransactionsModal(false)}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative bg-card border border-border w-full max-w-lg rounded-[32px] p-8 shadow-2xl overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-black text-maintext flex items-center gap-3">
                                        <CreditCard className="w-6 h-6 text-purple-500" />
                                        Payment History
                                    </h2>
                                    <button
                                        onClick={() => setShowTransactionsModal(false)}
                                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-subtext" />
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                    {isPaymentsLoading ? (
                                        <div className="flex flex-col items-center py-12">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                            <p className="text-sm text-subtext">Loading transactions...</p>
                                        </div>
                                    ) : payments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CreditCard className="w-8 h-8 text-subtext/40" />
                                            </div>
                                            <p className="text-maintext font-bold">No transactions yet</p>
                                            <p className="text-sm text-subtext mt-1">Your payment history will appear here.</p>
                                        </div>
                                    ) : (
                                        payments.map((tx) => (
                                            <div
                                                key={tx._id}
                                                className="p-4 bg-secondary/30 rounded-2xl border border-border flex justify-between items-center group hover:border-primary/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.status?.toLowerCase() === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                                        }`}>
                                                        <Check className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-maintext capitalize">{tx.plan || 'Upgrade'}</p>
                                                        <p className="text-xs text-subtext">{new Date(tx.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-maintext">₹{tx.amount}</p>
                                                    <p className="text-[10px] text-subtext font-mono truncate max-w-[100px]">ID: {tx.transactionId || tx._id}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowTransactionsModal(false)}
                                    className="w-full mt-6 py-4 bg-maintext text-card font-black rounded-2xl hover:opacity-90 transition-opacity"
                                >
                                    Close History
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Password Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl relative">
                            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full"><X className="w-5 h-5 text-subtext" /></button>
                            <h2 className="text-xl font-bold text-maintext mb-6">Change Password</h2>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="relative">
                                    <input type={showCurrentPassword ? 'text' : 'password'} placeholder="Current Password" required className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-12 text-maintext" value={passwordForm.current} onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))} />
                                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-subtext hover:text-maintext transition-colors">
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type={showNewPassword ? 'text' : 'password'} placeholder="New Password" required className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-12 text-maintext" value={passwordForm.new} onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))} />
                                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-subtext hover:text-maintext transition-colors">
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" required className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-12 text-maintext" value={passwordForm.confirm} onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-subtext hover:text-maintext transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 bg-secondary text-maintext font-bold rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl">Update</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
