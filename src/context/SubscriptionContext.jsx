import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getUserData } from '../userStore/userData';
import { apis } from '../types';
import toast from 'react-hot-toast';

const SubscriptionContext = createContext();

// Minimum credits required per feature
const FEATURE_CREDIT_COSTS = {
    chat: 1,
    deepSearch: 10,
    webSearch: 10,
    image: 20,
    video: 70,
    audio: 10,
    document: 10,
    codeWriter: 5,
};

export const SubscriptionProvider = ({ children }) => {
    const [subscription, setSubscription] = useState({
        plan_name: 'FREE',
        remaining_credits: 0,
        total_credits: 0,
        expiry_date: null,
        status: 'active',
        loading: true
    });

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [usageHistory, setUsageHistory] = useState([]);

    const fetchSubscriptionStatus = useCallback(async () => {
        const user = getUserData();
        if (!user || !user.token) {
            setSubscription(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            const response = await axios.get(apis.subscription.status, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.data && response.data.success) {
                setSubscription({
                    ...response.data.subscription,
                    loading: false
                });

                // Check for low credits warning (less than 10%)
                const sub = response.data.subscription;
                if (sub.remaining_credits > 0 && sub.remaining_credits < (sub.total_credits * 0.1)) {
                    toast("Your credits are running low.", {
                        icon: '⚠️',
                        duration: 5000,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching subscription:", error);
            setSubscription(prev => ({ ...prev, loading: false }));
        }
    }, []);

    const fetchUsageHistory = useCallback(async () => {
        const user = getUserData();
        if (!user || !user.token) return;

        try {
            const response = await axios.get(apis.subscription.history, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.data && response.data.success) {
                setUsageHistory(response.data.history);
            }
        } catch (error) {
            console.error("Error fetching usage history:", error);
        }
    }, []);

    useEffect(() => {
        fetchSubscriptionStatus();
        fetchUsageHistory();
    }, [fetchSubscriptionStatus, fetchUsageHistory]);

    /**
     * Check if user has enough credits for a feature locally (no API call).
     * Returns true if allowed, false if not (and opens upgrade modal).
     */
    const checkLimitLocally = useCallback((feature) => {
        const cost = FEATURE_CREDIT_COSTS[feature] || 1;
        const remaining = subscription.remaining_credits || 0;

        if (remaining < cost) {
            setIsUpgradeModalOpen(true);
            toast.error(`Insufficient credits for ${feature}. Please upgrade your plan.`, {
                duration: 3000,
            });
            return false;
        }
        return true;
    }, [subscription.remaining_credits]);

    return (
        <SubscriptionContext.Provider value={{
            ...subscription,
            usageHistory,
            isUpgradeModalOpen,
            setIsUpgradeModalOpen,
            refreshSubscription: fetchSubscriptionStatus,
            refreshHistory: fetchUsageHistory,
            checkLimitLocally,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
    return context;
};
