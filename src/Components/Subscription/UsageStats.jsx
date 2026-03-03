import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';
import { getUserData } from '../../userStore/userData';
import {
    Zap, Shield, Sparkles, AlertCircle, History, Info,
    TrendingUp, BarChart2, User, Mail, Crown, RefreshCcw,
    Clock, ChevronRight, Flame
} from 'lucide-react';

const TOOL_LABEL_MAP = {
    chat: 'Normal Chat',
    deep_search: 'Deep Search',
    real_time_search: 'Real-Time Search',
    generate_image: 'Generate Image',
    generate_video: 'Generate Video',
    convert_audio: 'Audio Convert',
    convert_document: 'Doc Convert',
    code_writer: 'Code Writer',
};

const TOOL_COLORS = {
    chat: 'bg-blue-500',
    deep_search: 'bg-purple-500',
    real_time_search: 'bg-cyan-500',
    generate_image: 'bg-pink-500',
    generate_video: 'bg-red-500',
    convert_audio: 'bg-amber-500',
    convert_document: 'bg-green-500',
    code_writer: 'bg-indigo-500',
};

const TOOL_COSTS = {
    chat: 1, deep_search: 10, real_time_search: 10,
    generate_image: 20, generate_video: 70,
    convert_audio: 10, convert_document: 10, code_writer: 5
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

const UsageStats = () => {
    const {
        remaining_credits,
        total_credits,
        plan_name,
        loading,
        usageHistory,
        refreshHistory,
        setIsUpgradeModalOpen
    } = useSubscription();

    const user = getUserData();

    // Aggregate tool-wise from usage history
    const toolBreakdown = useMemo(() => {
        const breakdown = {};
        (usageHistory || []).forEach(log => {
            const key = log.tool_name;
            if (!breakdown[key]) breakdown[key] = { count: 0, credits: 0 };
            breakdown[key].count += 1;
            breakdown[key].credits += log.credits_used || 0;
        });
        return Object.entries(breakdown)
            .sort((a, b) => b[1].credits - a[1].credits)
            .slice(0, 6);
    }, [usageHistory]);

    const totalUsed = total_credits - remaining_credits;
    const usedPercentage = total_credits > 0 ? (totalUsed / total_credits) * 100 : 0;
    const remainingPercentage = 100 - usedPercentage;
    const normPlan = (plan_name || 'FREE').toUpperCase();
    const isFree = normPlan === 'FREE';

    const recentHistory = useMemo(() =>
        [...(usageHistory || [])].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 8),
        [usageHistory]
    );

    if (loading) return (
        <div className="p-4 bg-surface/30 rounded-2xl border border-border mt-4 animate-pulse space-y-3">
            <div className="h-4 w-32 bg-border/50 rounded" />
            <div className="h-12 w-full bg-border/50 rounded-xl" />
            <div className="h-8 w-full bg-border/50 rounded-xl" />
        </div>
    );

    return (
        <div className="p-5 bg-white dark:bg-[#1f2937]/50 backdrop-blur-xl rounded-[2rem] border border-gray-100 dark:border-white/10 mt-4 shadow-xl space-y-5 overflow-hidden relative">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />

            {/* ── USER IDENTITY ── */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-primary/30 shrink-0 uppercase">
                    {user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-maintext truncate">{user?.name || 'Guest User'}</p>
                    <p className="text-[10px] font-bold text-subtext/70 truncate">{user?.email || '—'}</p>
                </div>
                <div className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isFree ? 'bg-gray-200/50 dark:bg-white/10 text-gray-500' : 'bg-primary/20 text-primary'}`}>
                    <Crown size={9} />
                    {normPlan}
                </div>
            </div>

            {/* ── CREDIT BALANCE ── */}
            <div className="relative z-10 p-4 rounded-2xl bg-gray-50/70 dark:bg-black/30 border border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[10px] font-black text-subtext uppercase tracking-widest opacity-60 mb-0.5">Remaining Credits</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-black text-maintext tracking-tighter">
                                {(remaining_credits || 0).toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-subtext opacity-60">/ {(total_credits || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest">Used</p>
                        <p className="text-xl font-black text-maintext">{totalUsed.toLocaleString()}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-200/50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/30 dark:border-white/5 p-0.5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(remainingPercentage, 0)}%` }}
                        transition={{ duration: 1.2, ease: 'circOut' }}
                        className={`h-full rounded-full relative overflow-hidden ${
                            remainingPercentage < 20 ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                            remainingPercentage < 50 ? 'bg-gradient-to-r from-orange-400 to-amber-500' :
                            'bg-gradient-to-r from-primary via-blue-500 to-indigo-500'
                        }`}
                    >
                        <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="absolute inset-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                    </motion.div>
                </div>

                <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] font-bold text-green-500">{remainingPercentage.toFixed(0)}% remaining</span>
                    <span className="text-[9px] font-bold text-red-400">{usedPercentage.toFixed(0)}% used</span>
                </div>
            </div>

            {/* ── LOW CREDITS WARNING ── */}
            <AnimatePresence>
                {remaining_credits < (total_credits * 0.15) && remaining_credits > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="relative z-10 flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/30 shrink-0">
                            <Flame size={15} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-black uppercase">Critical: Low Credits!</p>
                            <p className="text-[9px] text-red-500/70 font-bold">Your services may stop soon.</p>
                        </div>
                        <button
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="text-[9px] font-black text-white bg-red-500 px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors shrink-0"
                        >
                            Upgrade
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TOOL-WISE BREAKDOWN ── */}
            {toolBreakdown.length > 0 && (
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <BarChart2 size={11} className="text-primary" />
                            <span className="text-[10px] font-black text-maintext uppercase tracking-widest opacity-70">Tool-wise Usage</span>
                        </div>
                        <span className="text-[9px] font-bold text-subtext opacity-50 uppercase">{toolBreakdown.reduce((s, [, v]) => s + v.credits, 0)} cr. total</span>
                    </div>
                    <div className="space-y-2">
                        {toolBreakdown.map(([tool, data]) => {
                            const maxCredits = toolBreakdown[0][1].credits;
                            const pct = maxCredits > 0 ? (data.credits / maxCredits) * 100 : 0;
                            const colorClass = TOOL_COLORS[tool] || 'bg-primary';
                            return (
                                <div key={tool} className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} />
                                    <span className="text-[10px] font-bold text-maintext w-24 shrink-0 truncate">
                                        {TOOL_LABEL_MAP[tool] || tool}
                                    </span>
                                    <div className="flex-1 h-1.5 bg-gray-200/50 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'circOut' }}
                                            className={`h-full rounded-full ${colorClass} opacity-80`}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-primary shrink-0 w-12 text-right">
                                        {data.credits} cr.
                                    </span>
                                    <span className="text-[9px] font-bold text-subtext opacity-50 shrink-0">×{data.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── RECENT HISTORY ── */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        <History size={11} className="text-primary" />
                        <span className="text-[10px] font-black text-maintext uppercase tracking-widest opacity-70">Recent Activity</span>
                    </div>
                    <button
                        onClick={refreshHistory}
                        className="flex items-center gap-1 text-[9px] font-black text-primary opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <RefreshCcw size={9} />
                        Refresh
                    </button>
                </div>

                {recentHistory.length === 0 ? (
                    <div className="text-center py-5 text-subtext opacity-50">
                        <History size={24} className="mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No activity yet</p>
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {recentHistory.map((log, i) => {
                            const colorClass = TOOL_COLORS[log.tool_name] || 'bg-primary';
                            return (
                                <motion.div
                                    key={log._id || i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50/70 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all"
                                >
                                    <div className={`w-6 h-6 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                                        <Zap size={10} className="text-white fill-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-maintext truncate">
                                            {TOOL_LABEL_MAP[log.tool_name] || log.tool_name}
                                        </p>
                                        <p className="text-[9px] text-subtext opacity-50 font-bold flex items-center gap-1">
                                            <Clock size={8} />
                                            {formatTimeAgo(log.created_at)}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-black text-red-500 shrink-0">
                                        -{log.credits_used} cr.
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── CREDIT GUIDE ── */}
            <div className="relative z-10 p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 mb-2.5">
                    <Info size={10} className="text-primary" />
                    <h4 className="text-[9px] font-black text-primary uppercase tracking-widest opacity-70">Credit Guide</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {Object.entries(TOOL_COSTS).map(([tool, cost]) => (
                        <div key={tool} className="flex justify-between items-center text-[9px] font-bold text-gray-500 dark:text-gray-400">
                            <span className="truncate mr-1">{TOOL_LABEL_MAP[tool] || tool}</span>
                            <span className="text-primary shrink-0">{cost} cr.</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-subtext uppercase tracking-widest opacity-60">
                    <TrendingUp size={11} />
                    <span>Est. {Math.round((remaining_credits || 0) / 5)} more chats</span>
                </div>
                <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-white px-4 py-2 bg-gradient-to-r from-primary to-blue-600 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
                >
                    <Sparkles size={11} />
                    Upgrade
                </button>
            </div>
        </div>
    );
};

export default UsageStats;
