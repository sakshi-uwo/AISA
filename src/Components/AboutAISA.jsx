import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, MessageSquare, FileText, Image, Cloud, Camera, Mic, Share2, Scan, FileDiff, FileType, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AboutAISA = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    if (!isOpen) return null;

    const sections = [
        {
            title: t('coreIntelligence'),
            icon: <Bot className="w-5 h-5 text-blue-500" />,
            content: t('coreIntelligenceDesc')
        },
        {
            title: t('whyAisaExists'),
            icon: <Sparkles className="w-5 h-5 text-purple-500" />,
            content: t('whyAisaExistsDesc')
        }
    ];

    const features = [
        { title: t('smartChat'), icon: <MessageSquare className="w-4 h-4" />, desc: t('smartChatDesc') },
        { title: t('docAnalysis'), icon: <FileText className="w-4 h-4" />, desc: t('docAnalysisDesc') },
        { title: t('imageUnderstanding'), icon: <Image className="w-4 h-4" />, desc: t('imageUnderstandingDesc') },
        { title: t('addFromDrive'), icon: <Cloud className="w-4 h-4" />, desc: t('addFromDriveDesc') },
        { title: t('liveCamera'), icon: <Camera className="w-4 h-4" />, desc: t('liveCameraDesc') },
        { title: t('voiceAssistant'), icon: <Mic className="w-4 h-4" />, desc: t('voiceAssistantDesc') },
        { title: t('imageGen'), icon: <Share2 className="w-4 h-4" />, desc: t('imageGenDesc') },
        { title: t('multiModal'), icon: <FileDiff className="w-4 h-4" />, desc: t('multiModalDesc') },
        { title: t('smartScan'), icon: <Scan className="w-4 h-4" />, desc: t('smartScanDesc') },
        { title: t('pdfToDoc'), icon: <FileType className="w-4 h-4" />, desc: t('pdfToDocDesc') },
        { title: t('deepSearch'), icon: <Search className="w-4 h-4" />, desc: t('deepSearchDesc') }
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
                {/* Header */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-700 flex flex-col items-center justify-center text-white shrink-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-20" />
                    <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[80px]" />

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors z-50 cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>

                    <div className="relative z-10 text-center px-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <span className="text-xs font-bold tracking-wider uppercase">{t('nextGenPlatform')}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            AISA <sup className="text-lg font-bold">TM</sup>
                        </h2>
                        <p className="text-blue-100 text-lg font-medium max-w-xl mx-auto">
                            {t('aiSmartAssistant')}
                        </p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">

                    {/* Intro Section */}
                    <div className="text-center max-w-3xl mx-auto">
                        <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            {t('aboutIntro')}
                        </p>
                    </div>

                    {/* Core Sections Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {sections.map((sec, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-500/30 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        {sec.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{sec.title}</h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                                    {sec.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Features Grid */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">{t('powerhouseFeatures')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {features.map((feat, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-blue-500/20 transition-all group">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        {feat.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{feat.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Who is it for? */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-8 border border-blue-100 dark:border-white/5">
                        <h3 className="text-center text-lg font-bold text-gray-900 dark:text-white mb-6">{t('builtForEveryone')}</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            {[`🎓 ${t('students')}`, `💼 ${t('professionals')}`, `🏢 ${t('businesses')}`, `🎨 ${t('creators')}`, `🌍 ${t('everydayUsers')}`].map((label, i) => (
                                <span key={i} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer CTA */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md flex justify-between items-center shrink-0">
                    <p className="text-xs text-gray-500 font-medium hidden md:block">
                        {t('oneAssistant')}
                    </p>
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/dashboard/chat/new');
                        }}
                        className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {t('exploreAisa')}
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default AboutAISA;
