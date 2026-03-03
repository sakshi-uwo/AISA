import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User,
  LayoutGrid,
  MessageSquare,
  Bot,
  Settings2,
  LogOut,
  Zap,
  X,
  Video,
  FileText,
  Bell,
  Headphones,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Shield,
  Sparkles,
  ChevronRight,
  Search,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';
import { apis, AppRoute } from '../../types';
import { faqs } from '../../constants'; // Import shared FAQs
import NotificationBar from '../NotificationBar/NotificationBar.jsx';
import { useRecoilState } from 'recoil';
import { clearUser, getUserData, setUserData, toggleState, userData, sessionsData } from '../../userStore/userData';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { chatStorageService } from '../../services/chatStorageService';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSettingsDropdown from '../ProfileSettingsDropdown/ProfileSettingsDropdown.jsx';
import AdminHelpDesk from '../AdminHelpDesk.jsx';
import PricingModal from '../Pricing/PricingModal';
import usePayment from '../../hooks/usePayment';
import { useSubscription } from '../../context/SubscriptionContext';
import UsageStats from '../Subscription/UsageStats';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();


  const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  const navigate = useNavigate();
  const [notifiyTgl, setNotifyTgl] = useRecoilState(toggleState)
  const [currentUserData, setUserRecoil] = useRecoilState(userData);
  const user = currentUserData.user || getUserData() || { name: "Loading...", email: "...", role: "user" };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // null, 'success', 'error'
  const [issueText, setIssueText] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [issueType, setIssueType] = useState("General Inquiry");
  const [sessions, setSessions] = useRecoilState(sessionsData);
  const { sessionId } = useParams();
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || 'new');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isAdminHelpDeskOpen, setIsAdminHelpDeskOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { handlePayment, loading: paymentLoading } = usePayment();
  const { currentPlan, usage, refreshSubscription } = useSubscription();

  // Check if current user is admin - MUST have token AND correct email
  const token = getUserData()?.token;
  const userEmail = user?.email || getUserData()?.email;
  const isAdmin = token && userEmail === 'admin@uwo24.com';



  const issueCategories = t('issueCategories') || {};
  const issueOptions = [
    issueCategories.generalInquiry || "General Inquiry",
    issueCategories.paymentIssue || "Payment Issue",
    issueCategories.refundRequest || "Refund Request",
    issueCategories.technicalSupport || "Technical Support",
    issueCategories.accountAccess || "Account Access",
    issueCategories.other || "Other"
  ];

  const handleSupportSubmit = async () => {
    if (!issueText.trim()) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      await axios.post(apis.support, {
        name: user?.name || "Anonymous",
        email: user?.email || "guest@uwo24.com",
        issueType,
        message: issueText,
        userId: user?.id || null
      });
      setSendStatus('success');
      toast.success('Message sent successfully!');
      setIssueText(""); // Clear text
      setTimeout(() => setSendStatus(null), 3000); // Reset status after 3s
    } catch (error) {
      console.error("Support submission failed", error);
      setSendStatus('error');
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate(AppRoute.LANDING);
  };
  // token is already declared above

  useEffect(() => {
    // User data
    if (token) {
      axios.get(apis.user, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((res) => {
        if (res.data) {
          const mergedData = setUserData(res.data);
          setUserRecoil({ user: mergedData });
        }
      }).catch((err) => {
        console.error(err);
        if (err.status == 401) {
          clearUser()
        }
      })
    }

    // Notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(apis.notifications, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Notifications fetch failed", err);
      }
    };

    if (token) {
      fetchNotifications();
      // Refresh every 5 mins
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token])

  // Fetch chat sessions (Works for both guests and logged-in users)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await chatStorageService.getSessions();
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, [token, sessionId, setSessions]);

  // Update currentSessionId when sessionId changes
  useEffect(() => {
    setCurrentSessionId(sessionId || 'new');
  }, [sessionId]);

  const handleNewChat = () => {
    navigate('/dashboard/chat/new');
    onClose();
  };

  const handleDeleteSession = async (e, sessionIdToDelete) => {
    e.stopPropagation();
    try {
      await chatStorageService.deleteSession(sessionIdToDelete);
      const updatedSessions = await chatStorageService.getSessions();
      setSessions(updatedSessions);
      if (currentSessionId === sessionIdToDelete) {
        navigate('/dashboard/chat/new');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const startRename = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.sessionId);
    setNewTitle(session.title || "New Chat");
  };

  const handleRename = async (e, sessionId) => {
    e.stopPropagation();
    if (!newTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    const oldSessions = [...sessions];
    const renamedTitle = newTitle.trim();

    // Optimistic update
    setSessions(prev => prev.map(s =>
      s.sessionId === sessionId
        ? { ...s, title: renamedTitle, lastModified: Date.now() }
        : s
    ).sort((a, b) => b.lastModified - a.lastModified));

    try {
      const success = await chatStorageService.updateSessionTitle(sessionId, renamedTitle);
      if (success) {
        toast.success("Chat renamed");
      } else {
        throw new Error("Failed to sync rename to server");
      }
    } catch (err) {
      console.error("Rename failed:", err);
      toast.error("Could not rename chat on server");
      // Revert optimistic update
      setSessions(oldSessions);
    } finally {
      setEditingSessionId(null);
    }
  };

  if (notifiyTgl.notify) {
    setTimeout(() => {
      setNotifyTgl(prev => ({ ...prev, notify: false }));
    }, 2000);
  }
  // Dynamic class for active nav items
  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium border border-transparent ${isActive
      ? 'bg-primary/10 text-primary border-primary/10'
      : 'text-subtext hover:bg-surface hover:text-maintext'
    }`;



  return (
    <>
      <AnimatePresence>
        {notifiyTgl.notify && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className='fixed w-full z-10 flex justify-center items-center mt-5 ml-6'
          >
            <NotificationBar msg={"Successfully Owned"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for Mobile/Tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[100] w-[280px] sm:w-72 lg:w-64 
          bg-white/40 dark:bg-black/40 backdrop-blur-2xl 
          border-r border-white/20 dark:border-white/10
          flex flex-col transition-transform duration-300 ease-in-out 
          lg:relative lg:translate-x-0 
          shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
          lg:shadow-none
          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none before:rounded-r-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-4 flex items-center justify-between border-b border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <Link to="/" state={{ fromLogo: true }} className="relative z-10">
            <h1 className="text-xl font-bold text-primary drop-shadow-sm flex items-center gap-2">
              AISA <sup className="text-[10px] opacity-70">TM</sup>
            </h1>
          </Link>


          <button
            onClick={onClose}
            className="relative z-10 lg:hidden p-2 -mr-2 text-subtext hover:text-maintext rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-3 pt-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/30 dark:border-white/10 focus:border-primary/50 focus:bg-white/40 dark:focus:bg-black/40 focus:ring-4 focus:ring-primary/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-subtext/50 font-medium shadow-inner"
              />
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleNewChat}
              className="w-full bg-primary hover:opacity-90 hover:scale-[1.02] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30 text-sm border border-white/30 backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Plus className="w-4 h-4 relative z-10" /> <span className="relative z-10">{t('newChat')}</span>
            </button>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {(token || sessions.length > 0) ? (
              <>
                <h3 className="px-4 py-2 text-xs font-bold text-primary/70 uppercase tracking-widest">
                  {t('history')}
                </h3>

                {sessions
                  .filter(session => session.title?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((session) => (
                    <div key={session.sessionId} className="group relative px-2">
                      {editingSessionId === session.sessionId ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg border border-primary/20">
                          <input
                            autoFocus
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(e, session.sessionId);
                              if (e.key === 'Escape') setEditingSessionId(null);
                            }}
                            className="bg-transparent text-sm text-maintext w-full outline-none"
                          />
                          <button
                            onClick={(e) => handleRename(e, session.sessionId)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              navigate(`/dashboard/chat/${session.sessionId}`);
                              onClose();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all truncate pr-16 backdrop-blur-sm
                            ${currentSessionId === session.sessionId
                                ? 'bg-primary/20 text-primary shadow-md border border-primary/30 backdrop-blur-md'
                                : 'text-subtext hover:bg-white/20 dark:hover:bg-white/10 hover:text-primary border border-transparent hover:border-white/20'
                              }
                          `}
                          >
                            <div className="font-medium truncate text-[15px]">{session.title}</div>
                            <div className="text-[10px] text-subtext/70">
                              {new Date(session.lastModified).toLocaleDateString()}
                            </div>
                          </button>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => startRename(e, session)}
                              className="p-1.5 text-blue-500 hover:text-primary transition-all hover:bg-primary/10 rounded-lg"
                              title="Rename Chat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(e, session.sessionId)}
                              className="p-1.5 text-red-500 hover:text-red-600 transition-all hover:bg-red-500/10 rounded-lg"
                              title="Delete Chat"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                {sessions.length === 0 && (
                  <div className="px-4 text-xs text-subtext italic">{t('noRecentChats') || 'No recent chats'}</div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 opacity-50 px-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-subtext mb-2">Login to save your chat history</p>
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Log In Now
                </button>
              </div>
            )}
          </div>
        </div>


        {/* User Profile Footer */}
        <div className="p-3 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
          {token ? (
            <div className="relative profile-menu-container">
              {/* Profile Card - Clickable */}
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all flex items-center gap-2 p-2 group backdrop-blur-sm relative z-10"
              >


                <div className="flex-1 min-w-0 text-left flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-secondary border border-white/10">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-sm uppercase">
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <p className="text-sm font-bold text-maintext truncate group-hover:text-primary transition-colors">{user.name}</p>
                      {user.plan && user.plan !== 'Basic' && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsUpgradeModalOpen(true);
                          }}
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shrink-0 cursor-pointer hover:scale-110 transition-transform ${user.plan === 'King'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm'
                            : 'bg-primary text-white shadow-sm'
                            }`}
                          title="Click to Manage Plan"
                        >
                          {user.plan}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-subtext truncate">{user.email}</p>
                  </div>
                </div>


              </button>

              {/* Dropdown Menu - Replaced with Personalization System */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <ProfileSettingsDropdown
                    onClose={() => setIsProfileMenuOpen(false)}
                    onLogout={() => {
                      handleLogout();
                      setIsProfileMenuOpen(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Guest / Login State */
            <div
              onClick={() => navigate(AppRoute.LOGIN)}
              className="rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center gap-3 px-3 py-2 group backdrop-blur-sm relative z-10"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0 border border-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="font-bold text-maintext text-xs group-hover:text-primary transition-colors">
                {t('logIn')}
              </div>
            </div>
          )}

          <div className="mt-1 flex flex-col gap-1">
            {/* Admin Help Desk Button - Only for admin@uwo24.com */}
            {isAdmin && (
              <button
                onClick={() => setIsAdminHelpDeskOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-all text-xs border border-amber-500/20 hover:border-amber-500/30 font-semibold backdrop-blur-sm"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Admin Help Desk</span>
                <Shield className="w-3 h-3 opacity-70" />
              </button>
            )}

            {/* FAQ Button */}
            <button
              onClick={() => setIsFaqOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-subtext hover:bg-white/20 dark:hover:bg-white/10 hover:text-maintext transition-all text-xs border border-transparent hover:border-white/20 dark:hover:border-white/10 backdrop-blur-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('helpFaq')}</span>
            </button>
          </div>
        </div>
      </div >

      {/* FAQ Modal */}
      {
        isFaqOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

              <div className="p-6 border-b border-border flex justify-between items-center bg-secondary">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('faq')}
                    className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors uppercase ${activeTab === 'faq' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                  >
                    {t('faq') || 'FAQ'}
                  </button>
                  <button
                    onClick={() => setActiveTab('help')}
                    className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors uppercase ${activeTab === 'help' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                  >
                    {t('help') || 'Help'}
                  </button>
                </div>
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full text-subtext transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeTab === 'faq' ? (
                  <>
                    <p className="text-sm text-subtext font-medium">{t('faqSubtitle')}</p>
                    {((Array.isArray(t('faqList')) ? t('faqList') : faqs) || faqs).map((faq, index) => (
                      <div key={index} className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                          className="w-full flex justify-between items-center p-4 text-left hover:bg-secondary transition-colors focus:outline-none"
                        >
                          <span className="font-semibold text-maintext text-[15px]">{faq.question}</span>
                          {openFaqIndex === index ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-subtext" />
                          )}
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100 bg-secondary/50' : 'max-h-0 opacity-0'
                            }`}
                        >
                          <div className="p-4 pt-0 text-subtext text-sm leading-relaxed border-t border-border/50 mt-2 pt-3">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex flex-col gap-6">

                    {/* Issue Type Dropdown */}
                    <div>
                      <label className="block text-sm font-bold text-maintext mb-2">{t('selectIssueCategory')}</label>
                      <div className="relative">
                        <select
                          value={issueType}
                          onChange={(e) => setIssueType(e.target.value)}
                          className="w-full p-4 pr-10 rounded-xl bg-secondary border border-border focus:border-primary outline-none appearance-none text-maintext font-medium cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {issueOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext pointer-events-none" />
                      </div>
                    </div>

                    {/* Issue Description */}
                    <div>
                      <label className="block text-sm font-bold text-maintext mb-2">{t('describeYourIssue')}</label>
                      <textarea
                        className="w-full p-4 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none text-maintext min-h-[150px]"
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
                          <MessageSquare className="w-5 h-5" />
                          <span>{t('submitSupport')}</span>
                        </>
                      )}
                    </button>

                    {sendStatus === 'success' && (
                      <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                        {t('ticketSuccess') || "Ticket Submitted Successfully! Our team will contact you soon."}
                      </div>
                    )}

                    {sendStatus === 'error' && (
                      <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                        {t('ticketError') || "Failed to submit ticket. Please try again or email us directly."}
                      </div>
                    )}

                    <p className="text-xs text-center text-subtext">
                      {t('orEmailUsAt') || "Or email us directly at"} <a href="mailto:admin@uwo24.com" className="text-primary font-medium hover:underline">admin@uwo24.com</a>
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-surface text-center">
                <button
                  onClick={() => setIsFaqOpen(false)}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {t('close') || 'Close'}
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Admin Help Desk Modal */}
      {isAdmin && (
        <AdminHelpDesk
          isOpen={isAdminHelpDeskOpen}
          onClose={() => setIsAdminHelpDeskOpen(false)}
        />
      )}

    </>
  );
};

export default Sidebar;
