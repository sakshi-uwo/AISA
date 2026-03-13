import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Wand2, Download, Video as VideoIcon, Loader2, History, ArrowLeft, RotateCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomVideoPlayer from './CustomVideoPlayer';

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const MagicVideoGenModal = ({ isOpen, onClose, onCreditDeduction }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultVideoUrl, setResultVideoUrl] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyVideos, setHistoryVideos] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const token = JSON.parse(localStorage.getItem('user') || '{}')?.token;
            const res = await axios.get(`${baseURL}/api/video/history?type=imageToVideo`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.data.success) {
                setHistoryVideos(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            toast.error("Failed to load history.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (showHistory) {
            fetchHistory();
        }
    }, [showHistory]);
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error("Please select a valid image (JPG, PNG, WEBP)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResultVideoUrl(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage) {
            toast.error("Please select an image first");
            return;
        }
        if (!prompt.trim()) {
            toast.error("Please describe what to animate");
            return;
        }

        setIsGenerating(true);
        setResultVideoUrl(null);

        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("prompt", prompt);
        formData.append("isImageToVideo", "true");

        const token = JSON.parse(localStorage.getItem('user') || '{}')?.token;

        try {
            const response = await axios.post(`${baseURL}/api/video/generate`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setResultVideoUrl(response.data.videoUrl);
                if (onCreditDeduction) onCreditDeduction(50);
                toast.success("Video generated successfully!");
            }
        } catch (error) {
            console.error("Video Generation Error:", error);
            if (error.response?.data?.error === "Insufficient credits") {
                toast.error("Insufficient credits (Need 50 credits)");
            } else {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to generate video");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!resultVideoUrl) return;
        try {
            const token = JSON.parse(localStorage.getItem('user') || '{}')?.token;
            const response = await axios.post(`${baseURL}/api/video/download`, { videoUrl: resultVideoUrl }, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'video/mp4' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `aisa-animated-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download video");
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        setPrompt("");
        setResultVideoUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-xl z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Wand2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-maintext">
                                    {showHistory ? 'Your Video History' : 'Image to Video Magic'}
                                </h2>
                                <p className="text-xs text-subtext font-medium">
                                    {showHistory ? 'Previously generated videos' : 'Google Vertex AI Veo ⚡ 50 Credits'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!showHistory ? (
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-subtext hover:text-maintext hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <History className="w-4 h-4" /> History
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-subtext hover:text-maintext hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Generator
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-subtext hover:bg-black/5 dark:hover:bg-white/5 hover:text-maintext transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {showHistory ? (
                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            {isLoadingHistory ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : historyVideos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {historyVideos.map(video => (
                                        <div key={video._id} className="bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden border border-border flex flex-col group">
                                            <div className="relative aspect-video bg-black/10 dark:bg-white/10 flex items-center justify-center overflow-hidden">
                                                {video.videoUrl ? (
                                                    <video src={video.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata" />
                                                ) : (
                                                    <VideoIcon className="w-8 h-8 text-subtext/50" />
                                                )}
                                            </div>
                                            <div className="p-3 flex-1 flex flex-col justify-between">
                                                <p className="text-xs font-medium text-maintext line-clamp-2" title={video.prompt}>{video.prompt}</p>
                                                <div className="flex justify-between items-center mt-3">
                                                    <span className="text-[10px] text-subtext">{new Date(video.createdAt).toLocaleDateString()}</span>
                                                    <a href={video.videoUrl} download target="_blank" rel="noreferrer" className="text-primary hover:opacity-80 transition-opacity p-1 bg-primary/10 rounded-md">
                                                        <Download className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-subtext">
                                    <VideoIcon className="w-10 h-10 mb-2 opacity-50" />
                                    <p>No generated videos yet.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col gap-6">

                            {/* Preview Area */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Source Image */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-subtext uppercase tracking-wider">Source Image</span>
                                    {previewUrl ? (
                                        <div className="relative group w-full aspect-square bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden border border-border">
                                            <img src={previewUrl} alt="Original" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="opacity-0 group-hover:opacity-100 flex items-center gap-2 px-4 py-2 bg-white/90 text-black rounded-full font-semibold text-sm transform scale-95 group-hover:scale-100 transition-all shadow-lg"
                                                >
                                                    <Upload className="w-4 h-4" /> Change Frame
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`w-full aspect-square bg-black/5 dark:bg-white/5 border-2 border-dashed ${isDragging ? 'border-primary bg-primary/10' : 'border-border'} rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-subtext hover:text-primary group`}
                                        >
                                            <div className={`w-12 h-12 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-black/5 dark:bg-white/5'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <Upload className={`w-6 h-6 ${isDragging ? 'text-primary' : ''}`} />
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="text-sm font-semibold text-maintext">
                                                    {isDragging ? 'Drop Image Here' : 'Click or Drag Image'}
                                                </p>
                                                <p className="text-xs mt-1">First frame of the video</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Result Video */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-bold text-subtext uppercase tracking-wider">Video Result</span>
                                    <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border ${isGenerating ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border'} flex items-center justify-center bg-black/5 dark:bg-white/5`}>
                                        {isGenerating ? (
                                            <div className="flex flex-col items-center gap-4 text-primary animate-in fade-in duration-500">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <p className="text-sm font-semibold animate-pulse text-center px-4">Veo is animating...<br /><span className="text-xs font-medium opacity-75">This usually takes ~30 seconds</span></p>
                                            </div>
                                        ) : resultVideoUrl ? (
                                            <div className="w-full h-full animate-in zoom-in-95 duration-500 flex items-center justify-center bg-black">
                                                <CustomVideoPlayer src={resultVideoUrl} compact={true} />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-subtext/50">
                                                <VideoIcon className="w-8 h-8" />
                                                <p className="text-xs font-semibold">Ready for magic</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Input Field */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <label className="text-xs font-bold text-subtext uppercase tracking-wider">Animation Prompt</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        disabled={!selectedImage || isGenerating}
                                        placeholder="e.g. A cluster of vibrant wildflowers swaying gently in a sun-drenched meadow"
                                        className="w-full bg-black/5 dark:bg-white/5 border border-border rounded-2xl py-3.5 pl-4 pr-12 text-sm text-maintext outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !isGenerating && selectedImage && prompt.trim()) {
                                                e.preventDefault();
                                                handleGenerate();
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[11px] text-subtext ml-1">Be descriptive. Use phrases like "swaying gently", "camera pans left", "zooms in slowly".</p>
                            </div>

                        </div>
                    )}

                    {/* Footer Actions */}
                    {!showHistory && (
                        <div className="px-6 py-4 border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-[#1a1a1a] flex items-center justify-between shrink-0">
                            <button
                                onClick={handleReset}
                                className="text-sm font-semibold text-subtext hover:text-maintext transition-colors"
                            >
                                Reset
                            </button>

                            <div className="flex items-center gap-3">
                                {resultVideoUrl && (
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-maintext rounded-xl font-semibold text-sm transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={!selectedImage || !prompt.trim() || isGenerating}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all ${(!selectedImage || !prompt.trim() || isGenerating)
                                        ? 'bg-purple-500/50 text-white/70 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                                        </>
                                    ) : resultVideoUrl ? (
                                        <>
                                            <RotateCw className="w-4 h-4" /> Regenerate
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" /> Generate Video
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hidden input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg, image/png, image/webp"
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                </motion.div>
            </div >
        </AnimatePresence >
    );
};

export default MagicVideoGenModal;
