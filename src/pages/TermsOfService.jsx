import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Scale, AlertCircle, UserX, DollarSign, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { name } from '../constants';

const TermsOfService = () => {
    const navigate = useNavigate();

    const sections = [
        {
            icon: FileText,
            title: "Acceptance of Terms",
            content: [
                {
                    subtitle: "Agreement to Terms",
                    text: "By accessing or using AISA™, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service."
                },
                {
                    subtitle: "Eligibility",
                    text: "You must be at least 18 years old or the legal age in your country to use AISA™. Users under the legal age must have permission from a parent or guardian. By using our services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms."
                },
                {
                    subtitle: "Account Registration",
                    text: "To access certain features, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account."
                }
            ]
        },
        {
            icon: Scale,
            title: "Use of Services",
            content: [
                {
                    subtitle: "Permitted Use",
                    text: "AISA™ provides AI-powered intelligent assistance through specialized agents. You may use our services for lawful purposes including business operations, creative work, research, and personal productivity."
                },
                {
                    subtitle: "AI Agent Interactions",
                    text: "Our platform offers specialized AI agents (AIBOT, AICRAFT, etc.) for specific tasks. Each agent is designed for particular use cases. You agree to use agents only for their intended purposes as described in their documentation."
                },
                {
                    subtitle: "Multimodal Features",
                    text: "You may interact with AISA™ via text, voice, and vision inputs. By using these features, you grant us the right to process your inputs to generate AI responses. Content is processed securely and in accordance with our Privacy Policy."
                },
                {
                    subtitle: "Prohibited Activities",
                    text: "You may not: (a) attempt to hack, reverse engineer, or compromise our systems; (b) use the service for illegal activities; (c) generate harmful, abusive, or misleading content; (d) violate others' intellectual property rights; (e) share your account with others; (f) use automated systems to access our services without authorization."
                }
            ]
        },
        {
            icon: DollarSign,
            title: "Subscription & Payment",
            content: [
                {
                    subtitle: "Subscription Plans",
                    text: "AISA™ operates on a flexible subscription model. You can subscribe to individual AI agents or bundled plans. Pricing and plan details are available on our website and may change with notice."
                },
                {
                    subtitle: "Billing & Payments",
                    text: "Subscription fees are billed in advance on a monthly or annual basis depending on your selected plan. You authorize us to charge your payment method automatically for recurring subscriptions. Subscriptions may renew automatically unless cancelled before the end of the billing period. Pricing for all paid services will be clearly displayed before purchase."
                },
                {
                    subtitle: "Refunds & Cancellations",
                    text: "You may cancel your subscription at any time from your account settings. Cancellations take effect at the end of the current billing period. Refunds are provided on a case-by-case basis as per our refund policy."
                },
                {
                    subtitle: "Free Trial & Demos",
                    text: "We may offer free trials or demo access to new users. Free trials automatically convert to paid subscriptions unless canceled before the trial period ends."
                }
            ]
        },
        {
            icon: Shield,
            title: "Intellectual Property",
            content: [
                {
                    subtitle: "Our Content",
                    text: "All content, features, and functionality on AISA™, including but not limited to text, graphics, logos, AI models, and software, are owned by us or our licensors and protected by intellectual property laws."
                },
                {
                    subtitle: "User Content",
                    text: "You retain ownership of content you input into AISA™. However, you grant us a worldwide, non-exclusive license to use, process, and store your content solely to provide and improve our services."
                },
                {
                    subtitle: "AI-Generated Content",
                    text: "Content generated by AISA™ in response to your queries is provided to you for your use. We do not claim ownership of AI-generated outputs, but you acknowledge that similar outputs may be generated for other users."
                },
                {
                    subtitle: "Trademark",
                    text: "AISA™, our logo, and related marks are trademarks of our company. You may not use these marks without our prior written permission."
                }
            ]
        },
        {
            icon: AlertCircle,
            title: "Disclaimers & Limitations",
            content: [
                {
                    subtitle: "AI Generated Content Disclaimer",
                    text: "AISA™ provides responses generated by artificial intelligence. AI outputs may contain inaccuracies, outdated information, or errors. Users must verify important information before relying on AI-generated responses. AISA™ is not responsible for decisions made based on AI outputs."
                },
                {
                    subtitle: "Service Availability",
                    text: "We strive to provide reliable services but do not guarantee uninterrupted availability. Services may be updated, modified, or discontinued at any time. AISA™ is provided 'as is' and 'as available' without warranties of any kind, express or implied."
                },
                {
                    subtitle: "AI Accuracy",
                    text: "While our AI models are advanced and continually improving, we do not guarantee the accuracy, completeness, or reliability of AI-generated responses. You should verify important information independently."
                },
                {
                    subtitle: "No Professional Advice",
                    text: "AISA™ does not provide legal, medical, financial, or other professional advice. AI-generated content is for informational purposes only and should not replace consultation with qualified professionals."
                },
                {
                    subtitle: "Limitation of Liability",
                    text: "AISA™ is provided 'as is' without warranties. To the maximum extent permitted by law, AISA™ is not liable for damages, data loss, or decisions made using AI outputs, even if advised of the possibility of such damages."
                }
            ]
        },
        {
            icon: UserX,
            title: "Termination & Account Suspension",
            content: [
                {
                    subtitle: "Termination by You",
                    text: "You may terminate your account at any time through your account settings. Upon termination, your access to paid features will continue until the end of your billing period."
                },
                {
                    subtitle: "Termination by Us",
                    text: "We reserve the right to suspend or terminate your account if you violate these Terms, engage in prohibited activities, or if required by law. We will provide notice when possible."
                },
                {
                    subtitle: "Effect of Termination",
                    text: "Upon account termination, you lose access to all services and features. We may delete your data in accordance with our data retention policies, though some information may be retained as required by law."
                },
                {
                    subtitle: "Survival",
                    text: "Provisions regarding intellectual property, disclaimers, limitations of liability, and dispute resolution survive termination of your account."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-950 dark:via-indigo-950/10 dark:to-slate-950">
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
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 mb-6">
                        <Scale className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-maintext mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-lg text-subtext max-w-2xl mx-auto">
                        Please read these terms carefully before using our AI-powered platform.
                    </p>
                    <p className="text-sm text-subtext mt-4">
                        <strong>Last Updated:</strong> March 7, 2026
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
                        Welcome to {name}™. These Terms of Service ("Terms") govern your access to and use of our intelligent AI assistant platform, including all features, applications, content, and services (collectively, the "Service").
                    </p>
                    <p className="text-maintext leading-relaxed">
                        Please read these Terms carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                    </p>
                </motion.div>

                {/* Terms Sections */}
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
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                    <section.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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

                {/* Additional Terms */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-border shadow-sm"
                >
                    <h2 className="text-2xl font-bold text-maintext mb-6">Additional Terms</h2>
                    <div className="space-y-4 text-subtext leading-relaxed">
                        <div>
                            <h3 className="text-lg font-semibold text-maintext mb-2">Governing Law</h3>
                            <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-maintext mb-2">Changes to Terms</h3>
                            <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance of the modified Terms.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-maintext mb-2">Severability</h3>
                            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-maintext mb-2">Global Regulatory Compliance</h3>
                            <p>AISA™ operates in compliance with major global data protection and privacy regulations including:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><a href="https://gdpr.eu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">General Data Protection Regulation (GDPR) — EU</a></li>
                                <li><a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">California Consumer Privacy Act (CCPA) — USA</a></li>
                                <li><a href="https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PIPEDA — Canada</a></li>
                                <li><a href="https://www.pdpc.gov.sg/overview-of-pdpa/the-legislation/personal-data-protection-act" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Personal Data Protection Act (PDPA) — Singapore</a></li>
                                <li><a href="https://www.oaic.gov.au/privacy/the-privacy-act" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Act 1988 — Australia</a></li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Contact Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="mt-12 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-2xl p-8 border border-indigo-500/20"
                >
                    <h2 className="text-2xl font-bold text-maintext mb-4">Questions About These Terms?</h2>
                    <p className="text-subtext leading-relaxed mb-4">
                        If you have any questions about these Terms of Service, please contact us:
                    </p>
                    <div className="space-y-2 text-subtext">
                        <p><strong className="text-maintext">Email:</strong> <a href="mailto:admin@uwo24.com" className="text-primary hover:underline">admin@uwo24.com</a></p>
                        <p><strong className="text-maintext">Phone:</strong> <a href="tel:+918359890909" className="text-primary hover:underline">+91 83589 90909</a></p>
                        <p><strong className="text-maintext">Address:</strong> Jabalpur, Madhya Pradesh, India</p>
                    </div>
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

export default TermsOfService;
