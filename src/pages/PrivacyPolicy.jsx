import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Database, UserCheck, FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { name } from '../constants';
import { apiService } from '../services/apiService';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [lastUpdated, setLastUpdated] = useState("March 7, 2026");
    const [loading, setLoading] = useState(true);

    const defaultSections = [
        {
            icon: Database,
            title: "Information We Collect",
            content: [
                {
                    subtitle: "Account Information",
                    text: "When you create an AISA™ account, we collect your name, email address, and authentication credentials to provide you with personalized AI assistance."
                },
                {
                    subtitle: "Usage Data",
                    text: "We collect information about your interactions with our AI agents, including chat sessions, queries, and preferences to improve your experience and our services."
                },
                {
                    subtitle: "Multimodal Content",
                    text: "When you use our text, voice, or vision features, we process this content to provide AI-powered responses. Voice and image data are processed securely and not stored permanently unless you choose to save them."
                },
                {
                    subtitle: "Technical Information",
                    text: "We automatically collect device information, browser type, IP address, and usage patterns to maintain security and optimize performance."
                }
            ]
        },
        {
            icon: Lock,
            title: "How We Use Your Information",
            content: [
                {
                    subtitle: "Service Delivery",
                    text: "We use your data to provide contextual, intelligent AI responses, maintain chat history, and personalize your experience across all AISA™ features."
                },
                {
                    subtitle: "Product Improvement",
                    text: "Your interactions help us enhance our AI models, develop new features, and ensure high-quality reasoning and contextual understanding."
                },
                {
                    subtitle: "Communication",
                    text: "We use your email to send important updates, security alerts, subscription information, and support responses."
                },
                {
                    subtitle: "Security & Compliance",
                    text: "Your data helps us detect fraud, prevent abuse, maintain platform security, and comply with legal obligations."
                }
            ]
        },
        {
            icon: Shield,
            title: "Data Security & Protection",
            content: [
                {
                    subtitle: "End-to-End Encryption",
                    text: "All communications between you and AISA™ are protected with enterprise-grade encryption to ensure complete privacy and data integrity."
                },
                {
                    subtitle: "Isolated Environments",
                    text: "Each chat session runs in an isolated environment, preventing data leakage between users and ensuring your conversations remain private."
                },
                {
                    subtitle: "Secure Storage",
                    text: "Your data is stored on enterprise-grade servers with strict access controls, regular security audits, and automated backup systems."
                },
                {
                    subtitle: "Data Retention",
                    text: "Chat history is stored locally in your browser and on our secure servers. You can delete your chat sessions at any time from your dashboard."
                }
            ]
        },
        {
            icon: Eye,
            title: "Data Sharing & Third Parties",
            content: [
                {
                    subtitle: "No Sale of Personal Data",
                    text: "We do not sell personal data to third parties. We never sell your personal information or chat data. Your privacy is our top priority and this commitment applies globally."
                },
                {
                    subtitle: "AI Model Providers",
                    text: "We use advanced AI models to power AISA™. Your queries are processed securely, and no personal identifiable information is shared without encryption."
                },
                {
                    subtitle: "Service Providers",
                    text: "We work with trusted partners for payment processing, cloud hosting, and analytics. These partners are bound by strict confidentiality agreements."
                },
                {
                    subtitle: "Legal Requirements",
                    text: "We may disclose information when required by law, to protect our rights, or to prevent harm to our users or the public."
                }
            ]
        },
        {
            icon: UserCheck,
            title: "Your Rights & Control",
            content: [
                {
                    subtitle: "Access & Download",
                    text: "You can access all your account information and download your chat history from your profile settings at any time."
                },
                {
                    subtitle: "Correction & Updates",
                    text: "Update your personal information, preferences, language settings, and notification preferences directly from your account settings."
                },
                {
                    subtitle: "Deletion Rights",
                    text: "You have the right to delete individual chat sessions or request complete deletion of your personal data. Users may request deletion of their personal data by contacting support at admin@uwo24.com. Requests will be processed in accordance with applicable privacy regulations including GDPR, CCPA, and other data protection laws."
                },
                {
                    subtitle: "Opt-Out Options",
                    text: "Control your communication preferences, analytics tracking, and personalization features through the settings panel."
                }
            ]
        },
        {
            icon: FileText,
            title: "Cookies & Tracking",
            content: [
                {
                    subtitle: "Essential Cookies",
                    text: "We use necessary cookies to maintain your session, remember your preferences, and ensure platform functionality."
                },
                {
                    subtitle: "Analytics Cookies",
                    text: "With your consent, we use analytics tools to understand user behavior and improve our services. You can disable these in settings."
                },
                {
                    subtitle: "Local Storage",
                    text: "Chat sessions and preferences are stored in your browser's local storage for quick access and offline capabilities."
                },
                {
                    subtitle: "Cookie Management",
                    text: "You can manage cookie preferences through your browser settings or our Cookie Policy page. For more details, see our Cookie Policy."
                }
            ]
        }
    ];

    const getDynamicIcon = (index) => {
        const icons = [Database, Lock, Shield, Eye, UserCheck, FileText];
        return icons[index % icons.length] || FileText;
    };

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await apiService.getLegalPage('privacy-policy');
                if (data && data.sections && data.sections.length > 0) {
                    const mappedSections = data.sections.map((s, i) => ({
                        ...s,
                        icon: getDynamicIcon(i)
                    }));
                    setSections(mappedSections);
                    if (data.lastUpdated) {
                        setLastUpdated(new Date(data.lastUpdated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }));
                    }
                } else {
                    setSections(defaultSections);
                }
            } catch (err) {
                console.error("Failed to fetch dynamic policy:", err);
                setSections(defaultSections);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-subtext hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back</span>
                    </button>
                    <h1 className="text-xl font-bold text-primary">{name} <sup className="text-xs">TM</sup></h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                        <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-maintext mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-subtext max-w-2xl mx-auto">
                        Your privacy matters to us. Learn how we collect, use, and protect your data.
                    </p>
                    <p className="text-sm text-subtext mt-4">
                        <strong>Last Updated:</strong> {lastUpdated}
                    </p>
                </motion.div>

                {/* Introduction */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-8 mb-8 border border-border shadow-sm"
                >
                    <p className="text-maintext leading-relaxed mb-4">
                        Welcome to {name}™ ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered intelligent assistant platform.
                    </p>
                    <p className="text-maintext leading-relaxed">
                        By using {name}™, you agree to the collection and use of information in accordance with this policy. We are committed to maintaining the highest standards of privacy and security for all our users.
                    </p>
                </motion.div>

                {/* Policy Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (index + 2) }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-border shadow-sm hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <section.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-maintext mb-4">{section.title}</h2>
                                </div>
                            </div>

                            <div className="space-y-6 ml-16">
                                {section.content.map((item, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-lg font-semibold text-maintext mb-2">{item.subtitle}</h3>
                                        <p className="text-subtext leading-relaxed">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Global Regulatory Compliance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-border shadow-sm"
                >
                    <h2 className="text-2xl font-bold text-maintext mb-4">Global Regulatory Compliance</h2>
                    <p className="text-subtext leading-relaxed mb-4">
                        AISA™ operates in compliance with major global data protection and privacy regulations. We are committed to upholding user rights across all jurisdictions.
                    </p>
                    <div className="space-y-3">
                        {[
                            { name: "General Data Protection Regulation (GDPR) — EU", url: "https://gdpr.eu/" },
                            { name: "California Consumer Privacy Act (CCPA) — USA", url: "https://oag.ca.gov/privacy/ccpa" },
                            { name: "PIPEDA — Canada", url: "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/" },
                            { name: "Personal Data Protection Act (PDPA) — Singapore", url: "https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act" },
                            { name: "Privacy Act 1988 — Australia", url: "https://www.oaic.gov.au/privacy/the-privacy-act" }
                        ].map((reg, i) => (
                            <a key={i} href={reg.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl transition-colors group">
                                <Shield className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-sm text-maintext group-hover:text-primary transition-colors">{reg.name}</span>
                            </a>
                        ))}
                    </div>
                </motion.div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 bg-gradient-to-r from-primary/5 to-indigo-500/5 rounded-2xl p-8 border border-primary/20"
                >
                    <h2 className="text-2xl font-bold text-maintext mb-4">Questions About Privacy?</h2>
                    <p className="text-subtext leading-relaxed mb-4">
                        If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                    </p>
                    <div className="space-y-2 text-subtext">
                        <p><strong className="text-maintext">Email:</strong> <a href="mailto:admin@uwo24.com" className="text-primary hover:underline">admin@uwo24.com</a></p>
                        <p><strong className="text-maintext">Phone:</strong> <a href="tel:+918359890909" className="text-primary hover:underline">+91 83589 90909</a></p>
                        <p><strong className="text-maintext">Address:</strong> Jabalpur, Madhya Pradesh, India</p>
                    </div>
                </motion.div>

                {/* Policy Updates */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl"
                >
                    <h3 className="text-lg font-semibold text-maintext mb-2">Policy Updates</h3>
                    <p className="text-sm text-subtext leading-relaxed">
                        We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically for any changes.
                    </p>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-8 border-t border-border bg-white/50 dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-sm text-subtext">
                        © {new Date().getFullYear()} {name}™. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
