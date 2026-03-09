import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, CreditCard, Package, Settings, BarChart3,
    Search, Shield, Ban, Trash2, Plus, Edit2, X,
    TrendingUp, DollarSign, Activity, Zap,
    ChevronDown, Save, RefreshCw, ArrowLeft,
    Eye, EyeOff, Check, AlertCircle, FileText, PlusCircle, Headphones
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { getUserData } from '../userStore/userData';
import toast from 'react-hot-toast';
import { COOKIE_POLICY_DEFAULTS, TERMS_OF_SERVICE_DEFAULTS, PRIVACY_POLICY_DEFAULTS } from '../constants/legalDefaults';
import AdminHelpDesk from '../Components/AdminHelpDesk';

const ADMIN_EMAIL = 'admin@uwo24.com';

// ─── Tab Button ───
const TabButton = ({ active, icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${active
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'text-subtext hover:bg-white/20 dark:hover:bg-white/10 hover:text-maintext'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

// ─── Stat Card ───
const StatCard = ({ icon: Icon, label, value, color = 'primary', trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}`} />
                </div>
                {trend && (
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-maintext">{value}</p>
            <p className="text-xs font-semibold text-subtext uppercase tracking-wider mt-1">{label}</p>
        </div>
    </motion.div>
);

// ─── Section Card ───
const SectionCard = ({ title, children, action }) => (
    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/20 dark:border-white/10">
            <h3 className="font-bold text-maintext text-lg">{title}</h3>
            {action}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

// ═══════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════
const OverviewTab = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiService.getAdminOverviewStats();
                setStats(data.stats || data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} />
                <StatCard icon={Activity} label="Active Subscriptions" value={stats?.activeSubscriptions ?? 0} color="emerald-500" />
                <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats?.totalRevenue ?? 0}`} color="amber-500" />
                <StatCard icon={Zap} label="Credits Used" value={stats?.totalCreditsUsed ?? 0} color="violet-500" />
            </div>

            {stats?.toolUsage && stats.toolUsage.length > 0 && (
                <SectionCard title="Tool Usage Analytics">
                    <div className="space-y-3">
                        {stats.toolUsage.map((tool, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/20 dark:bg-white/5 rounded-xl border border-white/10">
                                <span className="font-semibold text-maintext text-sm">{tool._id || 'Unknown'}</span>
                                <div className="flex items-center gap-4 text-xs text-subtext">
                                    <span>{tool.count} uses</span>
                                    <span className="font-bold text-primary">{tool.totalCredits} credits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
};

// ═══════════════════════════════
// USERS TAB
// ═══════════════════════════════
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [upgradeData, setUpgradeData] = useState({ planName: '', expiryDate: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockToggle = async (userId, currentStatus) => {
        try {
            await apiService.toggleBlockUser(userId, !currentStatus);
            toast.success(currentStatus ? 'User unblocked' : 'User blocked');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure? This cannot be undone.')) return;
        try {
            await apiService.deleteUser(userId);
            toast.success('User deleted');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    const handleAdjustCredits = async (userId) => {
        if (!creditAmount) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/adjust-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getUserData()?.token}`
                },
                body: JSON.stringify({ userId, credits: parseInt(creditAmount) })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Credits adjusted');
                setCreditAmount('');
                setSelectedUser(null);
                fetchUsers();
            } else {
                toast.error(data.message || 'Failed');
            }
        } catch (err) {
            toast.error('Failed to adjust credits');
        }
    };

    const handleManualUpgrade = async (userId) => {
        if (!upgradeData.planName) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/manual-upgrade`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getUserData()?.token}`
                },
                body: JSON.stringify({ userId, ...upgradeData })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Plan upgraded');
                setUpgradeData({ planName: '', expiryDate: '' });
                setSelectedUser(null);
            } else {
                toast.error(data.message || 'Failed');
            }
        } catch (err) {
            toast.error('Failed to upgrade plan');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-primary/50 transition-all placeholder:text-subtext/50 text-maintext"
                />
            </div>

            {/* User List */}
            <div className="space-y-2">
                {filteredUsers.length === 0 && (
                    <p className="text-center text-subtext py-8 text-sm">No users found</p>
                )}
                {filteredUsers.map(user => (
                    <motion.div
                        key={user._id || user.id}
                        layout
                        className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-4 hover:border-primary/20 transition-all"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-maintext text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-subtext truncate">{user.email}</p>
                                </div>
                                {user.isBlocked && (
                                    <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">Blocked</span>
                                )}
                                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                                    {user.role || 'user'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedUser(selectedUser === (user._id || user.id) ? null : (user._id || user.id))}
                                    className="p-2 rounded-lg hover:bg-primary/10 text-subtext hover:text-primary transition-all"
                                    title="Manage"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleBlockToggle(user._id || user.id, user.isBlocked)}
                                    className={`p-2 rounded-lg transition-all ${user.isBlocked ? 'hover:bg-green-500/10 text-green-500' : 'hover:bg-amber-500/10 text-amber-500'}`}
                                    title={user.isBlocked ? 'Unblock' : 'Block'}
                                >
                                    {user.isBlocked ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user._id || user.id)}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Management Panel */}
                        <AnimatePresence>
                            {selectedUser === (user._id || user.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Adjust Credits */}
                                        <div className="bg-white/10 dark:bg-black/10 rounded-xl p-4 space-y-3">
                                            <h4 className="font-bold text-sm text-maintext flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-amber-500" /> Adjust Credits
                                            </h4>
                                            <p className="text-xs text-subtext">Current: {user.credits ?? '—'}</p>
                                            <input
                                                type="number"
                                                placeholder="New credit amount"
                                                value={creditAmount}
                                                onChange={e => setCreditAmount(e.target.value)}
                                                className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-primary/50 text-maintext"
                                            />
                                            <button
                                                onClick={() => handleAdjustCredits(user._id || user.id)}
                                                disabled={!creditAmount}
                                                className="w-full py-2 bg-amber-500 text-white rounded-lg font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-all"
                                            >
                                                Update Credits
                                            </button>
                                        </div>

                                        {/* Manual Plan Upgrade */}
                                        <div className="bg-white/10 dark:bg-black/10 rounded-xl p-4 space-y-3">
                                            <h4 className="font-bold text-sm text-maintext flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-primary" /> Manual Plan Upgrade
                                            </h4>
                                            <input
                                                type="text"
                                                placeholder="Plan name (e.g. Pro, Enterprise)"
                                                value={upgradeData.planName}
                                                onChange={e => setUpgradeData(p => ({ ...p, planName: e.target.value }))}
                                                className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-primary/50 text-maintext"
                                            />
                                            <input
                                                type="date"
                                                value={upgradeData.expiryDate}
                                                onChange={e => setUpgradeData(p => ({ ...p, expiryDate: e.target.value }))}
                                                className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-primary/50 text-maintext"
                                            />
                                            <button
                                                onClick={() => handleManualUpgrade(user._id || user.id)}
                                                disabled={!upgradeData.planName}
                                                className="w-full py-2 bg-primary text-white rounded-lg font-bold text-xs disabled:opacity-40 hover:opacity-90 transition-all"
                                            >
                                                Upgrade Plan
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════
// PLANS TAB
// ═══════════════════════════════
const PlansTab = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState({ planName: '', price: '', credits: '', durationDays: '', features: '' });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/pricing/plans`);
            const data = await response.json();
            setPlans(Array.isArray(data) ? data : data.plans || []);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const token = getUserData()?.token;
        const url = editingPlan
            ? `${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/plans/${editingPlan._id}`
            : `${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/plans`;
        const method = editingPlan ? 'PUT' : 'POST';

        try {
            const body = {
                ...form,
                price: Number(form.price),
                credits: Number(form.credits),
                durationDays: Number(form.durationDays),
                features: form.features.split(',').map(f => f.trim()).filter(Boolean)
            };
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                toast.success(editingPlan ? 'Plan updated' : 'Plan created');
                resetForm();
                fetchPlans();
            } else {
                toast.error(data.message || 'Failed');
            }
        } catch (err) {
            toast.error('Failed to save plan');
        }
    };

    const handleDelete = async (planId) => {
        if (!confirm('Delete this plan?')) return;
        try {
            const token = getUserData()?.token;
            await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/plans/${planId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Plan deleted');
            fetchPlans();
        } catch (err) {
            toast.error('Failed to delete plan');
        }
    };

    const startEdit = (plan) => {
        setEditingPlan(plan);
        setForm({
            planName: plan.planName || '',
            price: plan.price?.toString() || '',
            credits: plan.credits?.toString() || '',
            durationDays: plan.durationDays?.toString() || '',
            features: (plan.features || []).join(', ')
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ planName: '', price: '', credits: '', durationDays: '', features: '' });
        setEditingPlan(null);
        setShowForm(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" /> New Plan
                </button>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 space-y-4">
                            <h3 className="font-bold text-maintext">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input placeholder="Plan Name" value={form.planName} onChange={e => setForm(p => ({ ...p, planName: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                                <input placeholder="Price (₹)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                                <input placeholder="Credits" type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                                <input placeholder="Duration (days)" type="number" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                            </div>
                            <input placeholder="Features (comma-separated)" value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))}
                                className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                            <div className="flex gap-3 justify-end">
                                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-bold text-subtext hover:text-maintext hover:bg-white/20 transition-all">Cancel</button>
                                <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                                    {editingPlan ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Plan List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map(plan => (
                    <div key={plan._id} className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-bold text-maintext">{plan.planName}</h4>
                                <p className="text-2xl font-black text-primary mt-1">₹{plan.price}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(plan)} className="p-2 rounded-lg hover:bg-primary/10 text-subtext hover:text-primary transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(plan._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-subtext hover:text-red-500 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-subtext">
                            <p><span className="font-semibold text-maintext">{plan.credits}</span> credits</p>
                            <p><span className="font-semibold text-maintext">{plan.durationDays}</span> days</p>
                            {plan.features && plan.features.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                                    {plan.features.map((f, i) => (
                                        <p key={i} className="flex items-center gap-1.5">
                                            <Check className="w-3 h-3 text-green-500" /> {f}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {plans.length === 0 && <p className="text-subtext text-sm col-span-full text-center py-8">No plans created yet</p>}
            </div>
        </div>
    );
};

// ═══════════════════════════════
// PACKAGES TAB
// ═══════════════════════════════
const PackagesTab = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [form, setForm] = useState({ name: '', credits: '', price: '', description: '' });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/pricing/packages`);
            const data = await response.json();
            setPackages(Array.isArray(data) ? data : data.packages || []);
        } catch (err) {
            console.error('Failed to fetch packages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const token = getUserData()?.token;
        const url = editingPkg
            ? `${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/packages/${editingPkg._id}`
            : `${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/packages`;
        const method = editingPkg ? 'PUT' : 'POST';

        try {
            const body = { ...form, credits: Number(form.credits), price: Number(form.price) };
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                toast.success(editingPkg ? 'Package updated' : 'Package created');
                resetForm();
                fetchPackages();
            }
        } catch (err) {
            toast.error('Failed to save package');
        }
    };

    const handleDelete = async (pkgId) => {
        if (!confirm('Delete this package?')) return;
        try {
            const token = getUserData()?.token;
            await fetch(`${import.meta.env.VITE_AISA_BACKEND_API || 'http://localhost:8080/api'}/admin/packages/${pkgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Package deleted');
            fetchPackages();
        } catch (err) {
            toast.error('Failed to delete package');
        }
    };

    const startEdit = (pkg) => {
        setEditingPkg(pkg);
        setForm({ name: pkg.name || '', credits: pkg.credits?.toString() || '', price: pkg.price?.toString() || '', description: pkg.description || '' });
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ name: '', credits: '', price: '', description: '' });
        setEditingPkg(null);
        setShowForm(false);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" /> New Package
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 space-y-4">
                            <h3 className="font-bold text-maintext">{editingPkg ? 'Edit Package' : 'Create New Package'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input placeholder="Package Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                                <input placeholder="Credits" type="number" value={form.credits} onChange={e => setForm(p => ({ ...p, credits: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                                <input placeholder="Price (₹)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                                    className="bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                            </div>
                            <input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext" />
                            <div className="flex gap-3 justify-end">
                                <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-bold text-subtext hover:text-maintext hover:bg-white/20 transition-all">Cancel</button>
                                <button onClick={handleSubmit} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                                    {editingPkg ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map(pkg => (
                    <div key={pkg._id} className="bg-white/30 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5 hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-bold text-maintext">{pkg.name}</h4>
                                <p className="text-xs text-subtext mt-1">{pkg.description}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(pkg)} className="p-2 rounded-lg hover:bg-primary/10 text-subtext hover:text-primary transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(pkg._id)} className="p-2 rounded-lg hover:bg-red-500/10 text-subtext hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-primary">₹{pkg.price}</span>
                            <span className="text-xs text-subtext font-semibold">{pkg.credits} credits</span>
                        </div>
                    </div>
                ))}
                {packages.length === 0 && <p className="text-subtext text-sm col-span-full text-center py-8">No packages created yet</p>}
            </div>
        </div>
    );
};

// ═══════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════
const SettingsTab = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await apiService.getAdminSettings();
                setSettings(data);
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiService.updateAdminSettings(settings);
            toast.success('Settings saved');
        } catch (err) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <SectionCard
            title="Admin Settings"
            action={
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-subtext">Organization Name</label>
                    <input
                        value={settings?.organizationName || ''}
                        onChange={e => setSettings(p => ({ ...p, organizationName: e.target.value }))}
                        className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-subtext">Default AI Model</label>
                    <input
                        value={settings?.defaultModel || ''}
                        onChange={e => setSettings(p => ({ ...p, defaultModel: e.target.value }))}
                        className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-subtext">Max Tokens Per User</label>
                    <input
                        type="number"
                        value={settings?.maxTokensPerUser || ''}
                        onChange={e => setSettings(p => ({ ...p, maxTokensPerUser: Number(e.target.value) }))}
                        className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-primary/50 text-maintext"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-subtext">Allow Public Signup</label>
                    <button
                        onClick={() => setSettings(p => ({ ...p, allowPublicSignup: !p.allowPublicSignup }))}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${settings?.allowPublicSignup
                            ? 'bg-green-500/10 border-green-500/30 text-green-500'
                            : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}
                    >
                        {settings?.allowPublicSignup ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </div>
        </SectionCard>
    );
};

// ═══════════════════════════════
// LEGAL PAGES TAB
// ═══════════════════════════════
const LegalPagesTab = () => {
    const [selectedPage, setSelectedPage] = useState('cookie-policy');
    const [pageData, setPageData] = useState({ sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPage();
    }, [selectedPage]);

    const getDefaultsForPage = (type) => {
        switch (type) {
            case 'cookie-policy': return COOKIE_POLICY_DEFAULTS;
            case 'terms-of-service': return TERMS_OF_SERVICE_DEFAULTS;
            case 'privacy-policy': return PRIVACY_POLICY_DEFAULTS;
            default: return [];
        }
    };

    const fetchPage = async () => {
        setLoading(true);
        try {
            const data = await apiService.getLegalPage(selectedPage);
            if (data && data.sections && data.sections.length > 0) {
                setPageData(data);
            } else {
                // If no DB content exists, use the hardcoded defaults
                setPageData({
                    sections: getDefaultsForPage(selectedPage),
                    lastUpdated: new Date().toISOString()
                });
            }
        } catch (err) {
            toast.error('Failed to fetch legal page data');
            // Fallback to defaults on error too
            setPageData({ sections: getDefaultsForPage(selectedPage) });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiService.updateLegalPage(selectedPage, pageData.sections);
            toast.success('Legal page updated successfully');
        } catch (err) {
            toast.error('Failed to update legal page');
        } finally {
            setSaving(false);
        }
    };

    const addSection = () => {
        setPageData(prev => ({
            ...prev,
            sections: [...prev.sections, { title: 'New Section', content: [{ subtitle: 'New Subtitle', text: 'Section content here...' }] }]
        }));
    };

    const removeSection = (index) => {
        setPageData(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index)
        }));
    };

    const updateSection = (index, field, value) => {
        setPageData(prev => {
            const newSections = [...prev.sections];
            newSections[index] = { ...newSections[index], [field]: value };
            return { ...prev, sections: newSections };
        });
    };

    const addContent = (sectionIndex) => {
        setPageData(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                content: [...newSections[sectionIndex].content, { subtitle: 'New Subtitle', text: 'Content text here...' }]
            };
            return { ...prev, sections: newSections };
        });
    };

    const removeContent = (sectionIndex, contentIndex) => {
        setPageData(prev => {
            const newSections = [...prev.sections];
            newSections[sectionIndex] = {
                ...newSections[sectionIndex],
                content: newSections[sectionIndex].content.filter((_, i) => i !== contentIndex)
            };
            return { ...prev, sections: newSections };
        });
    };

    const updateContent = (sectionIndex, contentIndex, field, value) => {
        setPageData(prev => {
            const newSections = [...prev.sections];
            const newContent = [...newSections[sectionIndex].content];
            newContent[contentIndex] = { ...newContent[contentIndex], [field]: value };
            newSections[sectionIndex] = { ...newSections[sectionIndex], content: newContent };
            return { ...prev, sections: newSections };
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white/20 dark:bg-white/5 rounded-xl p-1 border border-white/10 overflow-x-auto scrollbar-hide">
                    {['cookie-policy', 'terms-of-service', 'privacy-policy'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedPage(type)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${selectedPage === type
                                ? 'bg-primary text-white shadow-md'
                                : 'text-subtext hover:bg-white/10 hover:text-maintext'
                                }`}
                        >
                            {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/30 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            <SectionCard
                title={`${selectedPage.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Content Management`}
                action={
                    <button
                        onClick={addSection}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold text-maintext border border-white/10 transition-all"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Section
                    </button>
                }
            >
                <div className="space-y-8">
                    {pageData.sections.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                            <p className="text-subtext text-sm mb-4">No custom content found. Using hardcoded defaults.</p>
                            <button
                                onClick={addSection}
                                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
                            >
                                Create First Section
                            </button>
                        </div>
                    )}
                    {pageData.sections.map((section, sIdx) => (
                        <div key={sIdx} className="relative bg-white/10 dark:bg-white/5 rounded-2xl p-6 border border-white/10">
                            <button
                                onClick={() => removeSection(sIdx)}
                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="mb-6 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Section Title</label>
                                <input
                                    value={section.title}
                                    onChange={e => updateSection(sIdx, 'title', e.target.value)}
                                    className="w-full bg-white/20 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-primary/50 text-maintext"
                                />
                            </div>

                            <div className="space-y-4 ml-6 pl-6 border-l-2 border-primary/20">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-subtext">Section Content Units</label>
                                    <button
                                        onClick={() => addContent(sIdx)}
                                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all"
                                    >
                                        <Plus className="w-2.5 h-2.5" /> Add Content
                                    </button>
                                </div>

                                {section.content.map((item, cIdx) => (
                                    <div key={cIdx} className="bg-white/10 dark:bg-black/20 rounded-xl p-4 space-y-3 relative group">
                                        <button
                                            onClick={() => removeContent(sIdx, cIdx)}
                                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>

                                        <div className="space-y-1">
                                            <input
                                                value={item.subtitle}
                                                onChange={e => updateContent(sIdx, cIdx, 'subtitle', e.target.value)}
                                                placeholder="Subtitle"
                                                className="w-full bg-transparent border-none p-0 text-sm font-bold outline-none text-maintext placeholder:text-subtext/30"
                                            />
                                            <textarea
                                                value={item.text}
                                                onChange={e => updateContent(sIdx, cIdx, 'text', e.target.value)}
                                                placeholder="Text content..."
                                                rows={3}
                                                className="w-full bg-transparent border-none p-0 text-xs outline-none text-subtext resize-none placeholder:text-subtext/30"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
};

// ─── Loading Spinner ───
const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
);

// ═══════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    // Verify admin access
    const user = getUserData();
    const isAdmin = user?.token && user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard/chat', { replace: true });
        }
    }, [isAdmin, navigate]);

    if (!isAdmin) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'plans', label: 'Plans', icon: CreditCard },
        { id: 'packages', label: 'Packages', icon: Package },
        { id: 'legal', label: 'Legal Pages', icon: FileText },
        { id: 'helpdesk', label: 'Help Desk', icon: Headphones },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'users': return <UsersTab />;
            case 'plans': return <PlansTab />;
            case 'packages': return <PackagesTab />;
            case 'legal': return <LegalPagesTab />;
            case 'helpdesk': return <AdminHelpDesk isOpen={true} isEmbedded={true} />;
            case 'settings': return <SettingsTab />;
            default: return <OverviewTab />;
        }
    };

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-maintext tracking-tight">Admin Dashboard</h1>
                            <p className="text-xs text-subtext font-semibold uppercase tracking-wider">Platform Management Console</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/chat')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-subtext hover:text-maintext hover:bg-white/20 dark:hover:bg-white/10 transition-all border border-white/20 dark:border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Chat
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            active={activeTab === tab.id}
                            icon={tab.icon}
                            label={tab.label}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderTab()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
