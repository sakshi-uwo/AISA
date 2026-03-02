import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Download, FastForward, Rewind } from 'lucide-react';
import { apiService } from '../services/apiService';

const CustomVideoPlayer = ({ src }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [skipAnim, setSkipAnim] = useState(null);
    const [aspectRatio, setAspectRatio] = useState('aspect-video');

    const fadeTimeoutRef = useRef(null);
    const lastTapTimeRef = useRef(0);

    useEffect(() => {
        // Try auto-playing
        if (videoRef.current) {
            videoRef.current.play().catch(e => {
                console.log("Auto-play prevented", e);
                setIsPlaying(false);
            });
        }
    }, [src]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const handleVideoClick = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
            // It's a double tap: momentarily revert the pause/play action from the 1st tap
            if (videoRef.current) {
                if (videoRef.current.paused) {
                    videoRef.current.play();
                    setIsPlaying(true);
                } else {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
            }

            const rect = videoRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;

            if (clickX < rect.width / 2) {
                skipBackward(e);
                setSkipAnim('left');
            } else {
                skipForward(e);
                setSkipAnim('right');
            }

            setTimeout(() => setSkipAnim(null), 500);
            lastTapTimeRef.current = 0; // reset
        } else {
            // Single tap
            togglePlay();
            lastTapTimeRef.current = now;
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            const w = videoRef.current.videoWidth;
            const h = videoRef.current.videoHeight;
            if (w && h) {
                if (h > w) {
                    setAspectRatio('aspect-[9/16]');
                } else if (h === w) {
                    setAspectRatio('aspect-square');
                } else {
                    setAspectRatio('aspect-video');
                }
            }
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const skipForward = (e) => {
        e?.stopPropagation?.();
        if (videoRef.current) {
            const newTime = Math.min(videoRef.current.currentTime + 2, duration);
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const skipBackward = (e) => {
        e?.stopPropagation?.();
        if (videoRef.current) {
            const newTime = Math.max(videoRef.current.currentTime - 2, 0);
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) { /* Safari */
                containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current.msRequestFullscreen) { /* IE11 */
                containerRef.current.msRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "00:00";
        const m = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const s = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleInteraction = () => {
        setShowControls(true);
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 1500);
    };

    const handleMouseLeave = () => {
        setShowControls(false);
    };

    useEffect(() => {
        if (isPlaying) {
            handleInteraction();
        } else {
            setShowControls(true);
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        };
    }, []);

    const [isDownloading, setIsDownloading] = useState(false);
    const handleDownload = async (e) => {
        e.stopPropagation();
        if (isDownloading) return;

        setIsDownloading(true);
        try {
            // Fetch the video through our backend proxy to bypass cross-origin restrictions
            const blob = await apiService.downloadVideo(src);
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = 'aisa-generated-video.mp4';
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed via proxy, falling back to direct link", error);
            const a = document.createElement('a');
            a.href = src;
            a.download = 'aisa-generated-video.mp4';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative w-full overflow-hidden bg-black/95 rounded-2xl border border-white/5 shadow-2xl group flex flex-col justify-center ${isFullscreen ? 'h-full rounded-none border-none' : aspectRatio}`}
            onMouseMove={handleInteraction}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleInteraction}
            onClick={handleInteraction}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover sm:object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={handleVideoClick}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controlsList="nodownload"
                playsInline
            />

            {/* Skip Animation Indicators */}
            {skipAnim === 'left' && (
                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center animate-pulse">
                    <div className="bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-5 mb-0.5 sm:mb-1">
                        <Rewind className="w-5 h-5 sm:w-10 sm:h-10 text-white fill-current" />
                    </div>
                    <span className="text-white font-bold text-xs sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">-2s</span>
                </div>
            )}
            {skipAnim === 'right' && (
                <div className="absolute right-[25%] top-1/2 -translate-y-1/2 translate-x-1/2 z-20 pointer-events-none flex flex-col items-center animate-pulse">
                    <div className="bg-black/40 backdrop-blur-md rounded-full p-2 sm:p-5 mb-0.5 sm:mb-1">
                        <FastForward className="w-5 h-5 sm:w-10 sm:h-10 text-white fill-current" />
                    </div>
                    <span className="text-white font-bold text-xs sm:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">+2s</span>
                </div>
            )}


            {/* AISA Watermark Logo */}
            <img
                src="/logo/Logo.svg"
                alt="AISA Watermark"
                className={`absolute right-4 sm:right-6 md:right-8 transition-all duration-300 pointer-events-none z-10 opacity-70 select-none mix-blend-screen ${showControls || !isPlaying ? 'bottom-14 sm:bottom-20 md:bottom-20' : 'bottom-2 sm:bottom-4 md:bottom-6'} w-8 sm:w-12 md:w-14 drop-shadow-2xl`}
            />

            {/* Floating Controls Bar */}
            <div
                className={`absolute bottom-3 sm:bottom-4 md:bottom-5 left-3 right-3 sm:left-4 sm:right-4 md:left-6 md:right-6 transition-all duration-300 transform ${showControls || !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
            >
                <div className="bg-[#2A2B32]/90 backdrop-blur-xl border border-white/10 rounded-lg sm:rounded-xl px-2 py-2 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-4 md:gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

                    {/* Download Button */}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`flex items-center gap-1 sm:gap-1.5 bg-primary hover:bg-primary/90 transition-all px-2 py-1 sm:px-3 sm:py-1.5 rounded text-white font-bold text-[8px] sm:text-[10px] tracking-wide shrink-0 ${isDownloading ? 'opacity-70 scale-95 cursor-wait animate-pulse' : 'active:scale-95'}`}
                        title={isDownloading ? "Downloading..." : "Download Video"}
                    >
                        {isDownloading ? (
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        )}
                        <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD'}</span>
                    </button>

                    {/* Skip Backward */}
                    <button
                        onClick={skipBackward}
                        className="text-white hover:text-[#8C52FF] transition-colors shrink-0 hidden sm:flex items-center gap-0.5"
                        title="Skip backward 2s"
                    >
                        <Rewind className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                        <span className="text-[8px] sm:text-[10px] font-bold font-mono">-2s</span>
                    </button>

                    {/* Play / Pause */}
                    <button
                        onClick={togglePlay}
                        className="text-white hover:text-[#8C52FF] transition-colors shrink-0 hidden sm:block"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current border-2 border-transparent" />}
                    </button>

                    {/* Skip Forward */}
                    <button
                        onClick={skipForward}
                        className="text-white hover:text-[#8C52FF] transition-colors shrink-0 hidden sm:flex items-center gap-0.5"
                        title="Skip forward 2s"
                    >
                        <FastForward className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                        <span className="text-[8px] sm:text-[10px] font-bold font-mono">+2s</span>
                    </button>

                    {/* Progress Bar Container */}
                    <div className="flex-1 flex items-center group/progress relative h-6 cursor-pointer">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-1.5 bg-white/20 rounded-full relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 bottom-0 bg-white group-hover/progress:bg-[#8C52FF] transition-colors rounded-full"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Time Display */}
                    <div className="text-white/80 text-[10px] sm:text-sm font-medium tracking-wide shrink-0 tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    {/* Volume control */}
                    <button
                        onClick={toggleMute}
                        className="text-white/80 hover:text-white transition-colors shrink-0 hidden sm:block"
                    >
                        {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>


                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="text-white/80 hover:text-white transition-colors shrink-0"
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default CustomVideoPlayer;
