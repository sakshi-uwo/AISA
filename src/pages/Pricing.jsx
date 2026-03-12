import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlans, getCreditPackages, purchasePlan, buyCredits, createSubscriptionOrder } from '../services/pricingService';
import './Pricing.css';
import { Check, X, ShieldAlert, Sparkles, Zap, Image as ImageIcon, Video, Search, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRecoilState } from 'recoil';
import { userData, updateUser } from '../userStore/userData';

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [packages, setPackages] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [userState, setUserState] = useRecoilState(userData);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const [plansData, packagesData] = await Promise.all([
        getPlans(),
        getCreditPackages()
      ]);
      setPlans(plansData.plans || []);
      setPackages(packagesData.packages || []);
    } catch (error) {
      toast.error('Failed to load pricing information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly');
  };

  const calculateEstimations = (credits, isFree = false) => {
    if (isFree) {
      // Free tier: only chat is available
      return [
        { text: `≈ ${credits} chats`, icon: <Zap size={14} /> },
        { text: 'Images — Paid Plans Only', icon: <ImageIcon size={14} />, locked: true },
        { text: 'Videos — Paid Plans Only', icon: <Video size={14} />, locked: true }
      ];
    }
    return [
      { text: `≈ ${credits} chats`, icon: <Zap size={14} /> },
      { text: `≈ ${Math.floor(credits / 60)} images`, icon: <ImageIcon size={14} /> },
      { text: `≈ ${Math.floor(credits / 300)} sec video`, icon: <Video size={14} /> }
    ];
  };

  const handleUpgrade = async (plan) => {
    try {
      setProcessing(true);
      const orderRes = await createSubscriptionOrder({ planId: plan._id, billingCycle });

      if (orderRes.isFree) {
        const res = await purchasePlan(plan._id, billingCycle);
        toast.success(`Successfully upgraded to ${plan.planName}!`);
        const updatedUser = updateUser({
          credits: res.credits,
          founderStatus: plan.planName.toLowerCase() === 'founder plan' ? true : userState.user.founderStatus
        });
        setUserState({ user: updatedUser });
        setProcessing(false);
        return;
      }

      const options = {
        key: orderRes.key,
        amount: orderRes.order.amount,
        currency: "INR",
        name: "AISA",
        description: `Upgrade to ${plan.planName}`,
        order_id: orderRes.order.id,
        handler: async function (response) {
          try {
            const res = await purchasePlan(plan._id, billingCycle);
            toast.success(`Successfully upgraded to ${plan.planName}!`);
            const updatedUser = updateUser({
              credits: res.credits,
              founderStatus: plan.planName.toLowerCase() === 'founder plan' ? true : userState.user.founderStatus
            });
            setUserState({ user: updatedUser });
          } catch (e) {
            toast.error('Failed to complete upgrade after payment.');
          }
        },
        prefill: {
          name: userState?.user?.name || "User",
          email: userState?.user?.email || ""
        },
        theme: { color: "#6366f1" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBuyCredits = async (pkg) => {
    try {
      setProcessing(true);
      const orderRes = await createSubscriptionOrder({ packageId: pkg._id });

      if (orderRes.isFree) {
        const res = await buyCredits(pkg._id);
        toast.success(`Purchased ${pkg.credits} credits!`);
        const updatedUser = updateUser({ credits: res.credits });
        setUserState({ user: updatedUser });
        setShowUpsell(false);
        setProcessing(false);
        return;
      }

      const options = {
        key: orderRes.key,
        amount: orderRes.order.amount,
        currency: "INR",
        name: "AISA",
        description: `Buy ${pkg.credits} Credits`,
        order_id: orderRes.order.id,
        handler: async function (response) {
          try {
            const res = await buyCredits(pkg._id);
            toast.success(`Purchased ${pkg.credits} credits!`);
            const updatedUser = updateUser({ credits: res.credits });
            setUserState({ user: updatedUser });
            setShowUpsell(false);
          } catch (e) {
            toast.error('Failed to complete purchase after payment.');
          }
        },
        prefill: {
          name: userState?.user?.name || "User",
          email: userState?.user?.email || ""
        },
        theme: { color: "#6366f1" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();

    } catch (err) {
      toast.error('Purchase failed.');
    } finally {
      setProcessing(false);
    }
  };

  const renderComparisonTable = () => {
    if (!plans.length) return null;

    const comparisonData = [
      {
        feature: 'AISA Chat',
        free: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        starter: <span className="feature-badge">✓ Priority</span>,
        founder: <span className="feature-badge">✓ Priority</span>,
        pro: <span className="feature-badge">✓ Priority</span>,
        business: <span className="feature-badge">✓ Priority</span>,
      },
      {
        feature: 'AISA Image HD',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        founder: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        pro: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        business: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
      },
      {
        feature: 'AISA Image Ultra',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        founder: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        pro: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        business: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
      },
      {
        feature: 'AISA Edit Image',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        founder: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        pro: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        business: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
      },
      {
        feature: 'AISA Video Fast',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="feature-badge">✓ 1080p</span>,
        founder: <span className="feature-badge">✓ 4K</span>,
        pro: <span className="feature-badge">✓ 4K</span>,
        business: <span className="feature-badge">✓ 4K</span>,
      },
      {
        feature: 'AISA Video Pro',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        founder: <span className="feature-badge">✓ 1080p & 4K</span>,
        pro: <span className="feature-badge">✓ 1080p & 4K</span>,
        business: <span className="feature-badge">✓ 1080p & 4K</span>,
      },
      {
        feature: 'AISA Deep Search',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        founder: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        pro: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
        business: <span className="flex items-center justify-center"><Check size={20} className="check-icon" /></span>,
      },
      {
        feature: 'AISA Doc Analysis',
        free: <span className="flex items-center justify-center"><X size={20} className="cross-icon" /></span>,
        starter: <span className="feature-badge">Advanced</span>,
        founder: <span className="feature-badge">Advanced</span>,
        pro: <span className="feature-badge" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>Expert</span>,
        business: <span className="feature-badge" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>Pro + Team</span>,
      }
    ];

    const getPlanKey = (planName) => {
      const name = planName.toLowerCase();
      if (name.includes('free')) return 'free';
      if (name.includes('starter')) return 'starter';
      if (name.includes('founder')) return 'founder';
      if (name.includes('pro')) return 'pro';
      if (name.includes('business')) return 'business';
      return 'free'; // fallback
    };

    return (
      <div className="comparison-section">
        <h2>Compare Plans Details</h2>
        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map(p => (
                  <th key={p._id}>{p.planName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-bold">{row.feature}</td>
                  {plans.map(plan => (
                    <td key={`${plan._id}-${row.feature}`}>
                      {row[getPlanKey(plan.planName)]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading incredible pricing...</div>;
  }

  return (
    <div className="pricing-page">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="pricing-header">
        <h1>Unlock Your AI Potential</h1>
        <p>Choose the perfect plan for you or your team. Upgrade anytime.</p>

        <div className="billing-toggle">
          <span className={`billing-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Monthly</span>
          <div className={`toggle-switch ${billingCycle}`} onClick={handleToggle}></div>
          <span className={`billing-label ${billingCycle === 'yearly' ? 'active' : ''}`}>Yearly</span>
          {billingCycle === 'yearly' && <span className="save-badge">Save ~30%</span>}
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const isFounder = plan.planName.toLowerCase().includes('founder');
          const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;

          // Fetch values straight from the Database
          let displayPrice = plan.priceMonthly;
          let totalYearlyAmount = 0;

          if (billingCycle === 'yearly' && !isFree && !isFounder) {
            // DB contains the total 12-month amount in priceYearly
            totalYearlyAmount = plan.priceYearly;
            // Calculate the per-month breakdown just for display purposes
            displayPrice = Math.round(plan.priceYearly / 12);
          }

          const displayCredits = (billingCycle === 'yearly' && plan.creditsYearly) ? plan.creditsYearly : plan.credits;

          return (
            <div key={plan._id} className={`pricing-card ${plan.isPopular ? 'popular' : ''} ${isFree ? 'free-tier-card' : ''}`}>
              {plan.badge && (
                <div className={`popular-badge ${isFounder ? 'launch-badge' : ''}`}>
                  {plan.badge}
                </div>
              )}
              {isFree && (
                <div className="free-tier-badge">💬 Chat Only</div>
              )}

              <h3 className="plan-name">{plan.planName}</h3>

              <div className="plan-price">
                {billingCycle === 'yearly' && !isFree && !isFounder && (
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.5em', marginRight: '6px' }}>
                    ₹{plan.priceMonthly}
                  </span>
                )}
                <span className="currency">₹</span>
                {displayPrice}
                <span className="billing-period">
                  {isFounder ? '/mo (lifetime)' : billingCycle === 'yearly' ? '/mo (billed yearly)' : '/mo'}
                </span>
              </div>

              <div className="plan-credits">
                <Sparkles size={18} /> {displayCredits} Credits
              </div>

              <div className="credit-details">
                {calculateEstimations(displayCredits, isFree).map((est, i) => (
                  <p key={i} className={est.locked ? 'locked-estimation' : ''}>
                    <span style={{ opacity: est.locked ? 0.4 : 1 }}>{est.icon}</span>
                    <span style={{ opacity: est.locked ? 0.4 : 1 }}>{est.text}</span>
                    {est.locked && <span className="lock-icon">🔒</span>}
                  </p>
                ))}
              </div>

              <ul className="feature-list">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={16} />
                    {feature}
                  </li>
                ))}
              </ul>


              <button
                className="cta-button"
                onClick={() => handleUpgrade(plan)}
                disabled={processing}
              >
                {displayPrice === 0
                  ? 'Start for Free'
                  : (billingCycle === 'yearly' && !isFounder)
                    ? `Upgrade for ₹${totalYearlyAmount}/yr`
                    : 'Upgrade to ' + plan.planName}
              </button>
            </div>
          );
        })}
      </div>

      {renderComparisonTable()}

      {/* Development Utility button to trigger UpSell popup test */}
      <div className="text-center mt-20 opacity-30 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setShowUpsell(true)}
          className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm"
        >
          [Dev] Test Micro Upsell Popup
        </button>
      </div>

      {showUpsell && (
        <div className="credit-modal-overlay">
          <div className="credit-modal">
            <div className="modal-header">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Instant Credit Boost</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Extra credits for when you're on a roll!</p>
            </div>

            <div className="package-list">
              {packages.map((pkg) => (
                <div key={pkg._id} className="package-item group" onClick={() => handleBuyCredits(pkg)}>
                  <div className="flex flex-col">
                    <span className="package-credits text-lg font-bold group-hover:text-blue-500 transition-colors">+{pkg.credits} Credits</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">One-time purchase</span>
                  </div>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm group-hover:bg-blue-600 group-hover:scale-105 transition-all">
                    ₹{pkg.price}
                  </div>
                </div>
              ))}
            </div>

            <button className="close-modal" onClick={() => setShowUpsell(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
