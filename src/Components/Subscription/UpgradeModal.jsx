import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Rocket, Briefcase, Building, Loader, Sparkles } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useRecoilState } from 'recoil';
import { userData } from '../../userStore/userData';
import usePayment from '../../hooks/usePayment';
import { getUserData } from '../../userStore/userData';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = () => {
    const { isUpgradeModalOpen, setIsUpgradeModalOpen, refreshSubscription } = useSubscription();
    const { handlePayment, loading } = usePayment();
    const navigate = useNavigate();
    const [currentUserData] = useRecoilState(userData);
    const user = currentUserData.user || getUserData();
    const [processingPlanId, setProcessingPlanId] = useState(null);

    useEffect(() => {
        if (!loading) setProcessingPlanId(null);
    }, [loading]);

    if (!isUpgradeModalOpen) return null;

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

    const plans = [
        {
            name: "FREE",
            price: "₹0",
            credits: 100,
            features: [
                "100 Total Credits",
                "Access to all tools",
                "Standard Support",
                "30 Days Validity"
            ],
            color: "from-gray-400 to-gray-600",
            bestFor: "Trial",
            icon: <Zap className="w-5 h-5 text-gray-500" />
        },
        {
            name: "STARTER",
            price: "₹500",
            credits: 500,
            icon: <Rocket className="w-5 h-5 text-blue-500" />,
            features: [
                "500 Total Credits",
                "Advanced AI Models",
                "Priority Support",
                "Valid for 30 days"
            ],
            color: "from-blue-600 to-indigo-600",
            bestFor: "Casual use"
        },
        {
            name: "PRO",
            price: "₹2850",
            credits: 3000,
            featured: true,
            icon: <Zap className="w-5 h-5 text-purple-500" />,
            features: [
                "3,000 Total Credits",
                "Fastest Response Time",
                "Premium Features",
                "Valid for 30 days"
            ],
            color: "from-purple-600 to-pink-600",
            bestFor: "Power users"
        },
        {
            name: "BUSINESS",
            price: "₹4500",
            credits: 50000,
            icon: <Briefcase className="w-5 h-5 text-green-500" />,
            features: [
                "5,000 Total Credits",
                "Team Collaboration",
                "Business Analytics",
                "Valid for 30 days"
            ],
            color: "from-green-600 to-teal-600",
            bestFor: "Small teams"
        },
        {
            name: "ENTERPRISE",
            price: "₹8000",
            credits: 100000,
            icon: <Building className="w-5 h-5 text-amber-500" />,
            features: [
                "100,000 Total Credits",
                "Custom Integration",
                "Dedicated Support",
                "Valid for 30 days"
            ],
            color: "from-amber-500 to-orange-600",
            bestFor: "Large Scale"
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-7xl bg-white dark:bg-[#121212] border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md shrink-0">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                Upgrade Your Power Level <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Choose the plan that fits your AI needs perfectly.</p>
                        </div>
                        <button onClick={() => setIsUpgradeModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                            {plans.map((p, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className={`relative p-5 rounded-3xl border-2 flex flex-col transition-all duration-300
                                        ${p.featured
                                            ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10'
                                            : 'border-gray-100 dark:border-white/5 bg-white/30 dark:bg-[#1a1a1a]/50 backdrop-blur-sm'
                                        }`}
                                >
                                    {p.featured && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap z-10">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 shadow-sm">{p.icon}</div>
                                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{p.bestFor}</span>
                                    </div>

                                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{p.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-2xl font-black text-primary">{p.price}</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">/month</span>
                                    </div>

                                    <ul className="space-y-2.5 mb-4 flex-1">
                                        {p.features.map((f, fIdx) => (
                                            <li key={fIdx} className="flex items-start gap-2.5 text-[12px] text-gray-700 dark:text-gray-300 leading-tight">
                                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Credit Usage Guide Section */}
                                    <div className={`mb-5 p-2.5 rounded-2xl border ${p.featured ? 'bg-primary/10 border-primary/20' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5'}`}>
                                        <h4 className={`text-[9px] font-black uppercase tracking-widest mb-2 text-center opacity-70 ${p.featured ? 'text-primary' : 'text-gray-400'}`}>Usage Guide</h4>
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                            {toolCosts.map((tool, tIdx) => (
                                                <div key={tIdx} className="flex justify-between items-center text-[8px] font-bold text-gray-500 dark:text-gray-400">
                                                    <span className="truncate mr-1">{tool.label}</span>
                                                    <span className="text-primary shrink-0">{tool.cost} cr.</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        disabled={loading}
                                        onClick={() => {
                                            if (!user) {
                                                navigate('/login');
                                                setIsUpgradeModalOpen(false);
                                                return;
                                            }
                                            setProcessingPlanId(p.name);
                                            handlePayment(p.name, user, () => {
                                                setIsUpgradeModalOpen(false);
                                                refreshSubscription();
                                            });
                                        }}
                                        className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all duration-300
                                            transform active:scale-95 bg-gradient-to-r uppercase tracking-widest
                                            ${p.featured ? 'from-primary to-blue-600 text-white shadow-lg shadow-primary/20' : 'from-gray-800 to-black dark:from-white dark:to-gray-200 text-white dark:text-black'}
                                            hover:opacity-90 flex items-center justify-center gap-2`}
                                    >
                                        {(loading && processingPlanId === p.name)
                                            ? <Loader className="w-4 h-4 animate-spin" />
                                            : `Get ${p.name}`
                                        }
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-black/20 text-center border-t border-gray-100 dark:border-white/10 shrink-0">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">AISA Intelligence System • Secure Payments via Razorpay</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UpgradeModal;
