import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { apis } from '../types';

const usePayment = () => {
    const [loading, setLoading] = useState(false);

    // Load Razorpay SDK
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = useCallback(async (planName, user, onSuccess) => {
        console.log(`[PAYMENT] Initializing purchase for plan: ${planName}`);
        setLoading(true);
        try {
            if (!user?.token) {
                throw new Error("User authentication token is missing. Please log in again.");
            }

            // 1. Create Order on Backend
            console.log(`[PAYMENT] Creating order on backend for ${planName}...`);
            const { data: orderData } = await axios.post(apis.subscription.purchase, {
                planName: planName
            }, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            console.log(`[PAYMENT] Backend order response:`, orderData);

            if (!orderData.success) {
                toast.error(orderData.message || 'Failed to create order');
                setLoading(false);
                return;
            }

            // 2. Load Razorpay SDK
            console.log(`[PAYMENT] Loading Razorpay SDK...`);
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                console.error(`[PAYMENT] Razorpay SDK failed to load`);
                toast.error('Failed to load payment gateway. Please try again.');
                setLoading(false);
                return;
            }

            // 3. Configure Razorpay Checkout
            console.log(`[PAYMENT] Opening Razorpay checkout window...`);
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SBFlInxBiRfOGd', 
                amount: orderData.order.amount, // Amount in paise
                currency: orderData.order.currency,
                name: 'AISA',
                description: `${planName} Plan Subscription`,
                order_id: orderData.order.id,
                handler: async function (response) {
                    console.log(`[PAYMENT] Razorpay payment successful, verifying on backend...`, response);
                    // 4. Payment Success - Verify on Backend
                    try {
                        const verifyResult = await axios.post(apis.subscription.verify, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planName: planName
                        }, {
                            headers: { 'Authorization': `Bearer ${user.token}` }
                        });

                        console.log(`[PAYMENT] Backend verification response:`, verifyResult.data);

                        if (verifyResult.data.success) {
                            toast.success('🎉 Payment Successful! Plan Upgraded.');
                            if (onSuccess) onSuccess();
                        } else {
                            toast.error(verifyResult.data.message || 'Verification failed');
                        }
                    } catch (error) {
                        console.error('[PAYMENT] Verification error:', error);
                        toast.error('Payment verification failed. Please contact support.');
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.name || '',
                    email: user.email || '',
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: function () {
                        console.log(`[PAYMENT] Checkout modal dismissed by user`);
                        toast.error('Payment cancelled');
                        setLoading(false);
                    }
                }
            };

            // 5. Open Razorpay Checkout
            if (!window.Razorpay) {
                console.error(`[PAYMENT] window.Razorpay is undefined after script load`);
                throw new Error("Payment gateway not initialized correctly.");
            }
            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();

        } catch (error) {
            console.error('[PAYMENT] Error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Something went wrong with payment';
            toast.error(errorMsg);
            setLoading(false);
        }
    }, []);

    return { handlePayment, loading };
};

export default usePayment;
