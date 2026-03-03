import React, { useState, useRef, useEffect, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Plus, Monitor, ChevronDown, History, Paperclip, X, FileText, Image as ImageIcon, Cloud, HardDrive, Edit2, Download, Mic, Wand2, Eye, FileSpreadsheet, Presentation, File as FileIcon, MoreVertical, Trash2, Check, Camera, Video, Copy, ThumbsUp, ThumbsDown, Share, Search, Undo2, Menu as MenuIcon, Volume2, Pause, Headphones, MessageCircle, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Minus, Code, Globe } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import * as XLSX from 'xlsx';
import { Menu, Transition, Dialog, Portal } from '@headlessui/react';
import { generateChatResponse } from '../services/geminiService';
import { chatStorageService } from '../services/chatStorageService';
import { useLanguage } from '../context/LanguageContext';
import { useRecoilState } from 'recoil';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from '../Components/Loader/Loader';
import toast from 'react-hot-toast';
import LiveAI from '../Components/LiveAI';
import { apiService } from '../services/apiService';

import ImageEditor from '../Components/ImageEditor';
import CustomVideoPlayer from '../Components/CustomVideoPlayer';
import ModelSelector from '../Components/ModelSelector';
import axios from 'axios';
import { apis } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { detectMode, getModeName, getModeIcon, getModeColor, MODES } from '../utils/modeDetection';
import { getUserData, sessionsData, toggleState, memoryData } from '../userStore/userData';
import { usePersonalization } from '../context/PersonalizationContext';
import OnboardingModal from '../Components/OnboardingModal';


const FEEDBACK_PROMPTS = {
  en: [
    "Was this helpful?",
    "How did I do?",
    "Is this answer detailed enough?",
    "Did I answer your question?",
    "Need anything else?",
    "Is this what you were looking for?",
    "Happy to help!",
    "Let me know if you need more info",
    "Any other questions?",
    "Hope this clears things up!"
  ],
  hi: [
    "क्या यह मददगार था?",
    "मैंने कैसा किया?",
    "क्या यह जवाब पर्याप्त है?",
    "क्या मैंने आपके सवाल का जवाब दिया?",
    "कुछ और चाहिए?",
    "क्या आप यही खोज रहे थे?",
    "मदद करके खुशी हुई!",
    "अगर और जानकारी चाहिए तो बताएं",
    "कोई और सवाल?",
    "उम्मीद है यह समझ आया!"
  ]
};

const TOOL_PRICING = {
  chat: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Free chat model' }
    ]
  },
  image: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Basic image analysis' },
      { id: 'gemini-pro', name: 'Gemini Pro Vision', price: 0.02, speed: 'Medium', description: 'Advanced image understanding' },
      { id: 'gpt4-vision', name: 'GPT-4 Vision', price: 0.05, speed: 'Slow', description: 'Premium image analysis' }
    ]
  },
  document: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Basic document analysis' },
      { id: 'gemini-pro', name: 'Gemini Pro', price: 0.02, speed: 'Medium', description: 'Advanced document processing' },
      { id: 'gpt4', name: 'GPT-4', price: 0.03, speed: 'Medium', description: 'Premium document analysis' }
    ]
  },
  voice: {
    models: [
      { id: 'gemini-flash', name: 'Gemini Flash', price: 0, speed: 'Fast', description: 'Standard voice recognition' }
    ]
  }
};


const ImageViewer = ({ src, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const imgRef = useRef(null);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 1));
  const handleReset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(s => Math.min(Math.max(1, s + delta), 5));
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Handlers for Mobile/iOS
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch start
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setLastTouchDistance(dist);
    } else if (e.touches.length === 1 && scale > 1) {
      // Drag start
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      // Pinch Zoom
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = dist / lastTouchDistance;
      setScale(s => Math.min(Math.max(1, s * delta), 5));
      setLastTouchDistance(dist);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Pan
      e.preventDefault(); // Prevent scroll
      setPosition({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(null);
  };

  // Reset position if zoomed out to 1
  useEffect(() => {
    if (scale === 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black/90 select-none">
      {/* Zoom Controls */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal
      >
        <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><Minus className="w-5 h-5" /></button>
        <span className="text-white text-sm font-bold font-mono min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><Plus className="w-5 h-5" /></button>
        <div className="w-px h-6 bg-white/20 mx-2"></div>
        <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="Reset"><RotateCcw className="w-4 h-4" /></button>
      </div>

      <div
        className="flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          className="max-w-full max-h-full object-contain pointer-events-auto"
          draggable={false}
          onLoad={() => console.log("Viewer image loaded successfully:", src)}
          onError={(e) => {
            console.error("Viewer image load failed:", src);
            if (src && !e.target.dataset.retried) {
              e.target.dataset.retried = "true";
              const retryUrl = src + (src.includes('?') ? '&' : '?') + 'retry=' + Date.now();
              console.log("Retrying viewer image:", retryUrl);
              e.target.src = retryUrl;
            } else {
              e.target.src = `https://placehold.co/800x600/333/eee?text=Image+Loading+Failed%0AClick+to+Retry`;
              e.target.style.cursor = 'pointer';
              e.target.onclick = (event) => {
                event.stopPropagation();
                e.target.src = src + (src.includes('?') ? '&' : '?') + 'reload=' + Date.now();
              };
            }
          }}
        />
      </div>
    </div>
  );
};

const Chat = () => {
  const { checkLimitLocally, refreshSubscription } = useSubscription();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { personalizations, getSystemPromptExtensions } = usePersonalization();

  const [messages, setMessages] = useState([]);
  const [excelHTML, setExcelHTML] = useState(null);
  const [textPreview, setTextPreview] = useState(null);
  const [sessions, setSessions] = useRecoilState(sessionsData);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId || 'new');
  const [tglState, setTglState] = useRecoilState(toggleState);
  const [memory, setMemoryRecoil] = useRecoilState(memoryData);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [pregeneratedPdfs, setPregeneratedPdfs] = useState({}); // Stores { msgId: FileObject }
  // WhatsApp Share Modal State
  const [waShareModal, setWaShareModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waPdfUrl, setWaPdfUrl] = useState('');
  const [waUploading, setWaUploading] = useState(false);
  const [waMsgContent, setWaMsgContent] = useState('');
  const [isMagicEditing, setIsMagicEditing] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [activeAgent, setActiveAgent] = useState({ agentName: 'AISA', category: 'General' });
  const [userAgents, setUserAgents] = useState([]);
  const [toolModels, setToolModels] = useState({
    chat: 'gemini-flash',
    image: 'gemini-flash',
    document: 'gemini-flash',
    voice: 'gemini-flash'
  });
  const uploadInputRef = useRef(null);
  const driveInputRef = useRef(null);
  const photosInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Attachment Menu State
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningTime, setListeningTime] = useState(0);
  const timerRef = useRef(null);
  const attachBtnRef = useRef(null);
  const menuRef = useRef(null);
  const recognitionRef = useRef(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [selectedToolType, setSelectedToolType] = useState(null);
  const [currentMode, setCurrentMode] = useState('NORMAL_CHAT');
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isImageGeneration, setIsImageGeneration] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAudioConvertMode, setIsAudioConvertMode] = useState(false);
  const [isDocumentConvert, setIsDocumentConvert] = useState(false);
  const [isCodeWriter, setIsCodeWriter] = useState(false);
  const [isVideoGeneration, setIsVideoGeneration] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const abortControllerRef = useRef(null);
  const voiceUsedRef = useRef(false); // Track if voice input was used
  const inputRef = useRef(null); // Ref for textarea input
  const transcriptRef = useRef(''); // Ref for speech transcript
  const isManualStopRef = useRef(false); // Track manual stop to avoid recursive loops

  const toolsBtnRef = useRef(null);
  const toolsMenuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Attach Menu
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        attachBtnRef.current &&
        !attachBtnRef.current.contains(event.target)
      ) {
        setIsAttachMenuOpen(false);
      }

      // Close Tools Menu
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target) &&
        toolsBtnRef.current &&
        !toolsBtnRef.current.contains(event.target)
      ) {
        setIsToolsMenuOpen(false);
      }
    };

    if (isAttachMenuOpen || isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    const handleGlobalPaste = (e) => {
      // Avoid intercepting if user is in an input/textarea other than our chat input
      const target = e.target;
      if (target.tagName === 'INPUT' || (target.tagName === 'TEXTAREA' && target !== inputRef.current)) {
        return;
      }
      handlePaste(e);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('paste', handleGlobalPaste);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isAttachMenuOpen, isToolsMenuOpen, messages.length, isLoading]);

  const processFile = (file) => {
    if (!file) return;

    let fileName = file.name || `file_${Date.now()}`;
    let fileType = file.type;

    // Browser might fail to detect type for some pasted/dragged files
    if (!fileType && fileName.includes('.')) {
      const ext = fileName.split('.').pop().toLowerCase();
      const mimeMap = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppt': 'application/vnd.ms-powerpoint',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
      };
      if (mimeMap[ext]) fileType = mimeMap[ext];
    }

    // List of allowed types for the AI to process (extendable)
    const validMimes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    const isAllowed = validMimes.some(mime => fileType?.startsWith(mime) || fileType === mime);

    // Even if not in list, let's allow it but maybe warn? 
    // Actually, AISA can handle most text/data files.

    const fileWithMetadata = new File([file], fileName, { type: fileType || 'application/octet-stream' });
    setSelectedFiles(prev => [...prev, fileWithMetadata]);

    // Generate Preview using DataURL (more persistent for chat messages)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreviews(prev => [...prev, {
        url: reader.result,
        name: fileName,
        type: fileType || 'application/octet-stream',
        size: file.size,
        id: Math.random().toString(36).substr(2, 9)
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => processFile(file));
    setIsAttachMenuOpen(false); // Close menu after selection

    // [PROACTIVE FEATURE]: If this is a new chat (no messages), automatically trigger analysis
    if (messages.length === 0 && !isLoading) {
      setTimeout(() => {
        handleSendMessage();
      }, 1000); // 1s delay to ensure FileReader (in processFile) has finished
    }
  };

  const handlePaste = (e) => {
    // Only handle if there are files (blobs) or items in clipboard
    const items = e.clipboardData?.items;
    const files = e.clipboardData?.files;
    let handled = false;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            handled = true;
          }
        }
      }
    }

    // Fallback for older browsers or specific mobile behaviors
    if (!handled && files && files.length > 0) {
      Array.from(files).forEach(file => {
        processFile(file);
        handled = true;
      });
    }

    if (handled) {
      e.preventDefault(); // Don't paste the filename as text if we handled the file
      toast.success("File pasted! 📎");
    }
  };

  const handleRemoveFile = (id) => {
    if (id) {
      // Find the file name to remove from selectedFiles
      const previewToRemove = filePreviews.find(p => p.id === id);
      if (previewToRemove) {
        setSelectedFiles(prev => prev.filter(f => f.name !== previewToRemove.name));
        setFilePreviews(prev => prev.filter(p => p.id !== id));
      }
    } else {
      // Clear all
      setSelectedFiles([]);
      setFilePreviews([]);
    }
    if (uploadInputRef.current) uploadInputRef.current.value = '';
    if (driveInputRef.current) driveInputRef.current.value = '';
    if (photosInputRef.current) photosInputRef.current.value = '';
  };

  const handleAttachmentSelect = (type) => {
    setIsAttachMenuOpen(false);
    if (type === 'upload') {
      uploadInputRef.current?.click();
    } else if (type === 'photos') {
      photosInputRef.current?.click();
    } else if (type === 'drive') {
      driveInputRef.current?.click();
    } else if (type === 'doc-voice') {
      document.getElementById('doc-voice-upload')?.click();
    }
  };

  const handleDocToVoiceSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!checkLimitLocally('audio')) {
      e.target.value = '';
      return;
    }

    setIsAttachMenuOpen(false);

    // 1. Show User Message immediately with the file
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Content = reader.result; // Full Data URL for display
      const base64Data = base64Content.split(',')[1]; // Raw base64 for backend

      let activeSessionId = currentSessionId;
      if (activeSessionId === 'new') {
        activeSessionId = await chatStorageService.createSession();
        setCurrentSessionId(activeSessionId);
        isNavigatingRef.current = true;
        navigate(`/dashboard/chat/${activeSessionId}`, { replace: true });
      }

      // Add User Message
      const userMsgId = Date.now().toString();
      const userMsg = {
        id: userMsgId,
        role: 'user',
        content: `Please convert this document to audio: **${file.name}**`,
        timestamp: new Date(),
        attachments: [{
          url: base64Content,
          name: file.name,
          type: file.type
        }]
      };
      setMessages(prev => [...prev, userMsg]);
      chatStorageService.saveMessage(activeSessionId, userMsg, `Audio: ${file.name}`).catch(e => console.error(e));

      // 2. Add Processing Message from AISA
      const aiMsgId = (Date.now() + 1).toString();
      const processingMsg = {
        id: aiMsgId,
        role: 'assistant',
        content: `⚡ **EXTRACTING CONTENT...**\nReading text from **${file.name}**...`,
        timestamp: new Date(),
        isProcessing: true
      };
      setMessages(prev => [...prev, processingMsg]);
      scrollToBottom();

      // Update UI slightly after extraction
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMsgId && msg.isProcessing ? {
          ...msg,
          content: `🎧 **CONVERTING TO VOICE...**\nSynthesizing natural audio for **${file.name}**. This won't take long!`
        } : msg));
      }, 1500);
      scrollToBottom();

      // 3. Start Conversion - Added high timeout for long docs
      try {
        const response = await axios.post(apis.synthesizeFile, {
          fileData: base64Data,
          mimeType: file.type || 'application/pdf',
          gender: 'FEMALE'
        }, {
          responseType: 'arraybuffer',
          timeout: 0,
          headers: { Authorization: `Bearer ${getUserData()?.token}` }
        });

        // 4. Success - Update AI Message with Player and Download
        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const reader2 = new FileReader();
        reader2.readAsDataURL(audioBlob);
        reader2.onloadend = () => {
          const mp3Base64 = reader2.result.split(',')[1];
          const rawBytes = response.data.byteLength;
          const charCount = response.headers['x-text-length'] || 0;
          const formattedFileSize = rawBytes > 1024 * 1024
            ? (rawBytes / (1024 * 1024)).toFixed(1) + ' MB'
            : (rawBytes / 1024).toFixed(1) + ' KB';

          const aiResponse = {
            id: aiMsgId,
            role: 'model',
            isProcessing: false,
            content: `✅ I have successfully converted **${file.name}** into a full audio voice.`,
            conversion: {
              file: mp3Base64,
              blobUrl: audioUrl,
              fileName: `${file.name.split('.')[0]}_Audio.mp3`,
              mimeType: 'audio/mpeg',
              fileSize: formattedFileSize,
              rawSize: rawBytes,
              charCount: charCount
            },
            timestamp: new Date()
          };

          setMessages(prev => prev.map(msg => msg.id === aiMsgId ? aiResponse : msg));
          chatStorageService.saveMessage(activeSessionId, aiResponse).catch(e => console.error(e));

          toast.success("Conversion complete! 🎶");
          refreshSubscription();
          scrollToBottom();
        };

      } catch (err) {
        console.error('[DocToVoice Error]:', err);
        let errorMsg = "Extraction Failed";
        let errorDetail = err.message;

        if (err.response?.data) {
          try {
            // Buffer result handling
            const errorData = err.response.data instanceof ArrayBuffer
              ? JSON.parse(new TextDecoder().decode(err.response.data))
              : err.response.data;

            errorMsg = errorData.error || errorMsg;
            errorDetail = errorData.details || errorDetail;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
        }

        const serverError = errorMsg + (errorDetail ? `: ${errorDetail}` : "");
        const errorResponse = {
          id: aiMsgId,
          role: 'model',
          isProcessing: false,
          content: `❌ **Conversion Failed**\n${serverError}`,
          timestamp: new Date()
        };

        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? errorResponse : msg));
        chatStorageService.saveMessage(activeSessionId, errorResponse).catch(e => console.error(e));

      }
    };
    reader.readAsDataURL(file);

    e.target.value = ''; // Always reset so user can click/upload same file again
  };

  const manualFileToAudioConversion = async (file, activeSessionId) => {
    if (!file) return;

    if (!checkLimitLocally('audio')) {
      return;
    }

    // 1. Show User Message immediately with the file
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Content = reader.result;
      const base64Data = base64Content.split(',')[1];
      console.log(`[DEBUG] manualFileToAudioConversion: file=${file.name}, type=${file.type}, size=${file.size}`);

      const userMsgId = Date.now().toString();
      const userMsg = {
        id: userMsgId,
        role: 'user',
        content: `Convert this document to audio: **${file.name}**`,
        timestamp: new Date(),
        attachments: [{ url: base64Content, name: file.name, type: file.type }]
      };
      setMessages(prev => [...prev, userMsg]);
      chatStorageService.saveMessage(activeSessionId, userMsg, `Audio: ${file.name}`).catch(e => console.error(e));

      const aiMsgId = (Date.now() + 1).toString();
      const processingMsg = {
        id: aiMsgId,
        role: 'assistant',
        content: `⚡ **EXTRACTING CONTENT...**\nReading **${file.name}**...`,
        timestamp: new Date(),
        isProcessing: true
      };
      setMessages(prev => [...prev, processingMsg]);
      scrollToBottom();

      // Second stage update
      setTimeout(() => {
        setMessages(prev => prev.map(msg => msg.id === aiMsgId && msg.isProcessing ? {
          ...msg,
          content: `🎧 **CONVERTING TO VOICE...**\nAlmost there! Preparing your audio for **${file.name}**...`
        } : msg));
      }, 1200);

      try {
        console.log(`[VoiceConversion] Sending request to: ${apis.synthesizeFile}`);
        const response = await axios.post(apis.synthesizeFile, {
          fileData: base64Data,
          mimeType: file.type || 'application/pdf',
          gender: 'FEMALE'
        }, {
          responseType: 'arraybuffer',
          timeout: 300000, // 5 minute timeout for large files on live servers
          headers: { Authorization: `Bearer ${getUserData()?.token}` }
        });

        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const reader2 = new FileReader();
        reader2.readAsDataURL(audioBlob);
        reader2.onloadend = () => {
          const mp3Base64 = reader2.result.split(',')[1];
          const rawBytes = response.data.byteLength;
          const charCount = response.headers['x-text-length'] || 0;
          const formattedSize = rawBytes > 1024 * 1024 ? (rawBytes / (1024 * 1024)).toFixed(1) + ' MB' : (rawBytes / 1024).toFixed(1) + ' KB';

          const aiResponse = {
            id: aiMsgId,
            role: 'model',
            isProcessing: false,
            content: `✅ Audio conversion complete for **${file.name}**.`,
            conversion: {
              file: mp3Base64,
              blobUrl: audioUrl,
              fileName: `${file.name.split('.')[0]}_Audio.mp3`,
              mimeType: 'audio/mpeg',
              fileSize: formattedSize,
              rawSize: rawBytes,
              charCount: charCount
            },
            timestamp: new Date()
          };

          setMessages(prev => prev.map(msg => msg.id === aiMsgId ? aiResponse : msg));
          chatStorageService.saveMessage(activeSessionId, aiResponse).catch(e => console.error(e));
          toast.success("File converted successfully!");
          refreshSubscription();
          scrollToBottom();
        };
      } catch (err) {
        console.error('[ManualConversion Error]:', err);
        let errorMsg = "Conversion Failed";
        let errorDetail = err.message;

        if (err.response?.data) {
          try {
            // Buffer result handling
            const errorData = err.response.data instanceof ArrayBuffer
              ? JSON.parse(new TextDecoder().decode(err.response.data))
              : err.response.data;

            errorMsg = errorData.error || errorMsg;
            errorDetail = errorData.details || errorDetail || err.message;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
        }
        const serverError = errorMsg + (errorDetail ? `: ${errorDetail}` : "");
        const errorResponse = {
          id: aiMsgId,
          role: 'model',
          isProcessing: false,
          content: `❌ **Conversion Failed**\n${serverError}`,
          timestamp: new Date()
        };
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? errorResponse : msg));
        chatStorageService.saveMessage(activeSessionId, errorResponse).catch(e => console.error(e));
        toast.error("Conversion failed");
      }
    };
    reader.readAsDataURL(file);
  };

  const manualTextToAudioConversion = async (text, activeSessionId) => {
    if (!text || !text.trim()) return;

    if (!checkLimitLocally('audio')) {
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: `Convert this text to audio: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    const talkTitle = text.length > 20 ? text.substring(0, 20) + '...' : text;
    chatStorageService.saveMessage(activeSessionId, userMsg, `Audio Talk: ${talkTitle}`).catch(e => console.error(e));


    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: `🎧 **Generating voice for your text...**`,
      timestamp: new Date(),
      isProcessing: true
    }]);
    scrollToBottom();

    try {
      const response = await axios.post(apis.synthesizeFile, {
        introText: text,
        gender: 'FEMALE'
      }, { responseType: 'arraybuffer', timeout: 0, headers: { Authorization: `Bearer ${getUserData()?.token}` } });

      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const reader2 = new FileReader();
      reader2.readAsDataURL(audioBlob);
      reader2.onloadend = () => {
        const mp3Base64 = reader2.result.split(',')[1];
        const rawBytes = response.data.byteLength;
        const charCount = response.headers['x-text-length'] || 0;
        const formattedSize = rawBytes > 1024 * 1024 ? (rawBytes / (1024 * 1024)).toFixed(1) + ' MB' : (rawBytes / 1024).toFixed(1) + ' KB';

        const aiResponse = {
          id: aiMsgId,
          role: 'model',
          isProcessing: false,
          content: `✅ Your text has been converted to voice audio.`,
          conversion: {
            file: mp3Base64,
            blobUrl: audioUrl,
            fileName: `AISA_Voice_${Date.now()}.mp3`,
            mimeType: 'audio/mpeg',
            fileSize: formattedSize,
            rawSize: rawBytes,
            charCount: charCount
          },
          timestamp: new Date()
        };

        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? aiResponse : msg));
        chatStorageService.saveMessage(activeSessionId, aiResponse).catch(e => console.error(e));
        toast.success("Text converted successfully!");
        refreshSubscription();
        scrollToBottom();
      };
    } catch (err) {
      console.error('[ManualTextConversion Error]:', err);
      const serverError = err.response?.data?.details || err.response?.data?.error || err.message;
      const errorResponse = {
        id: aiMsgId,
        role: 'model',
        isProcessing: false,
        content: `❌ **Conversion Failed**\n${serverError}`,
        timestamp: new Date()
      };
      setMessages(prev => prev.map(msg => msg.id === aiMsgId ? errorResponse : msg));
      chatStorageService.saveMessage(activeSessionId, errorResponse).catch(e => console.error(e));
      toast.error("Conversion failed");
    }
  };

  const handleGenerateVideo = async (overridePrompt, activeSessionId = currentSessionId) => {
    if (!checkLimitLocally('video')) {
      return;
    }
    try {
      if (!inputRef.current?.value.trim() && !overridePrompt && selectedFiles.length === 0) {
        // toast.error('Please enter a prompt or select a file');
        // Let it slide if it's voice input (handled elsewhere)
        if (!voiceUsedRef.current) return;
      }

      const prompt = overridePrompt || inputRef.current?.value || "";
      // const filesToSend = [...selectedFiles]; // Snapshot // This variable is not used

      // Voice Reader Mode Logic
      if (isVoiceMode) {
        try {
          // 1. Add User Message to UI
          const userMsgId = Date.now().toString();
          const newUserMsg = {
            id: userMsgId,
            role: 'user', // Ensure role user
            content: prompt, // Use content
            timestamp: new Date(),
            attachments: filePreviews.map(fp => ({
              url: fp.url,
              name: fp.name,
              type: fp.type
            }))
          };
          setMessages(prev => [...prev, newUserMsg]);

          // Clear Inputs
          setInputValue('');
          setSelectedFiles([]);
          setFilePreviews([]);
          if (inputRef.current) inputRef.current.style.height = 'auto';

          // Save to backend
          if (activeSessionId && activeSessionId !== 'new') {
            chatStorageService.saveMessage(activeSessionId, newUserMsg).catch(err => console.error("Error saving voice message:", err));
          }

          // 2. Trigger Voice Reading Directly
          setIsLoading(true);

          // Show a "Reading..." AI bubble
          const aiMsgId = (Date.now() + 1).toString();
          const readingMsg = {
            id: aiMsgId,
            role: 'model', // Ensure role assistant
            content: "🎧 Reading content aloud...", // Use content
            timestamp: new Date()
          };
          setMessages(prev => [...prev, readingMsg]);

          if (activeSessionId && activeSessionId !== 'new') {
            chatStorageService.saveMessage(activeSessionId, readingMsg).catch(err => console.error("Error saving reading bubble:", err));
          }

          setTimeout(() => {
            speakResponse(prompt, 'en-US', aiMsgId, newUserMsg.attachments);
            setIsLoading(false);
          }, 500);

          return; // STOP HERE (Do not call AI API)
        } catch (err) {
          console.error("Voice mode handler failed:", err);
        }
      }

      setIsLoading(true);
      // isSendingRef.current = true; // Mark as sending // This variable is not defined in the provided context

      // 1. Add User Message to UI
      const userMsgId = Date.now().toString();
      const userMsg = {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
        attachments: filePreviews.map(fp => ({
          url: fp.url,
          name: fp.name,
          type: fp.type
        }))
      };

      // Show a message that video generation is in progress
      const tempId = (Date.now() + 1).toString();
      const newMessage = {
        id: tempId,
        role: 'model',
        isGenerating: true,
        content: `🎬 Generating video from prompt: "${prompt}"\n\nPlease wait, this may take a moment...`, // Use content
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg, newMessage]);
      if (inputRef.current) inputRef.current.value = '';
      setInputValue('');
      handleRemoveFile();

      // Ensure the prompt and loading state are visible
      setTimeout(() => scrollToBottom(true), 50);

      // Save user message to backend
      if (activeSessionId && activeSessionId !== 'new') {
        chatStorageService.saveMessage(activeSessionId, userMsg).catch(err => console.error("Error saving video user message:", err));
      }

      try {
        // Use apiService
        const data = await apiService.generateVideo(prompt, 5, 'medium', videoAspectRatio);

        if (data.videoUrl) {
          // Add the generated video to the message
          const videoMessage = {
            id: tempId, // Keep same ID
            role: 'model',
            isGenerating: false,
            content: `🎥 Video generated successfully!`, // Use content
            videoUrl: data.videoUrl,
            timestamp: new Date(),
          };

          setMessages(prev => prev.map(msg => msg.id === tempId ? videoMessage : msg));
          toast.success('Video generated successfully!');
          refreshSubscription();

          // Save AI response to backend
          if (activeSessionId && activeSessionId !== 'new') {
            chatStorageService.saveMessage(activeSessionId, videoMessage).catch(err => console.error("Error saving video results:", err));
          }

        } else if (data.imageUrl) {
          // Add image fallback
          const imageMessage = {
            id: tempId, // Keep same ID
            role: 'model',
            content: `🖼️ ${data.message || 'Video generation limit reached. Generated a preview image instead.'}`,
            imageUrl: data.imageUrl,
            timestamp: new Date(),
          };

          setMessages(prev => prev.map(msg => msg.id === tempId ? imageMessage : msg));
          toast.success('Generated preview image');
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to generate video';

        // If we got an image URL even with error (sometimes happens with 200 fallback but let's be safe)
        if (error.response?.data?.imageUrl) {
          const imageMessage = {
            id: tempId,
            role: 'model',
            content: `🖼️ ${error.response.data.message || 'Video generation failed. Generated preview.'}`,
            imageUrl: error.response.data.imageUrl,
            timestamp: new Date(),
          };
          setMessages(prev => prev.map(msg => msg.id === tempId ? imageMessage : msg));
          return;
        }

        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, content: `❌ ${errorMsg}` } : msg));
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error('Error initiating video generation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (overridePrompt, activeSessionId = currentSessionId) => {
    if (!checkLimitLocally('image')) {
      return;
    }
    try {
      if (!inputRef.current?.value.trim() && !overridePrompt) {
        toast.error('Please enter a prompt for image generation');
        return;
      }

      const prompt = overridePrompt || inputRef.current.value;
      setIsLoading(true);

      // 1. Add User Message to UI
      const userMsgId = Date.now().toString();
      const userMsg = {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
        attachments: filePreviews.map(fp => ({
          url: fp.url,
          name: fp.name,
          type: fp.type.startsWith('image/') ? 'image' :
            fp.type.includes('pdf') ? 'pdf' :
              fp.type.includes('word') || fp.type.includes('document') ? 'docx' : 'file'
        }))
      };

      // Show a message that image generation is in progress
      const tempId = (Date.now() + 1).toString();
      const newMessage = {
        id: tempId,
        role: 'model',
        isGenerating: true,
        content: `🎨 Generating image from prompt: "${prompt}"\n\nPlease wait, this may take a moment...`, // Use content
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg, newMessage]);
      if (inputRef.current) inputRef.current.value = '';
      setInputValue('');
      handleRemoveFile();

      // Ensure the prompt and loading state are visible
      setTimeout(() => scrollToBottom(true), 50);

      // Save user message to backend
      if (activeSessionId && activeSessionId !== 'new') {
        chatStorageService.saveMessage(activeSessionId, userMsg).catch(err => console.error("Error saving image user message:", err));
      }

      try {
        // Use apiService
        const data = await apiService.generateImage(prompt, imageAspectRatio);

        if (data && (data.imageUrl || data.data)) {
          const finalUrl = data.imageUrl || data.data; // Handle different response structures
          const imageMessage = {
            id: tempId, // Keep same ID
            role: 'model',
            isGenerating: false,
            content: `🖼️ Image generated successfully!`, // Use content
            imageUrl: finalUrl,
            timestamp: new Date(),
          };

          setMessages(prev => prev.map(msg => msg.id === tempId ? imageMessage : msg));

          toast.success('Image generated successfully!');
          refreshSubscription();

          // Save AI response to backend
          if (activeSessionId && activeSessionId !== 'new') {
            chatStorageService.saveMessage(activeSessionId, imageMessage).catch(err => console.error("Error saving image generation results:", err));
          }
        }
      } catch (error) {
        console.error("Image Gen Error Details:", error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to generate image';
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, content: `❌ ${errorMsg}` } : msg)); // Use content
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Error initiating image generation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditImage = async (overridePrompt, activeSessionId = currentSessionId) => {
    if (!checkLimitLocally('image')) {
      return;
    }
    try {
      const prompt = overridePrompt || inputRef.current?.value || "";
      if (!prompt) {
        toast.error('Please enter instructions for image editing');
        return;
      }

      // Check for attached image
      const imageFile = filePreviews.find(f => f.type.startsWith('image/'));
      if (!imageFile) {
        toast.error('Please upload an image to edit');
        return;
      }

      setIsLoading(true);

      // 1. Add User Message to UI
      const userMsgId = Date.now().toString();
      const userMsg = {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date(),
        attachments: filePreviews.map(fp => ({
          url: fp.url,
          name: fp.name,
          type: fp.type.startsWith('image/') ? 'image' : 'file'
        }))
      };

      // Show a message that image editing is in progress
      const tempId = (Date.now() + 1).toString();
      const newMessage = {
        id: tempId,
        role: 'model',
        isGenerating: true,
        content: `🪄 Editing your image: "${prompt}"\n\nPlease wait while AISA works its magic...`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg, newMessage]);
      if (inputRef.current) inputRef.current.value = '';
      setInputValue('');

      // Ensure the prompt and loading state are visible
      setTimeout(() => scrollToBottom(true), 50);

      // Save user message to backend
      if (activeSessionId && activeSessionId !== 'new') {
        chatStorageService.saveMessage(activeSessionId, userMsg).catch(err => console.error("Error saving image edit user message:", err));
      }

      try {
        console.log("[Image Edit] Starting edit request for:", prompt);

        // Efficiently get base64 from Data URL or Fetch Blob URL
        let base64Image = null;
        try {
          if (imageFile.url.startsWith('data:')) {
            base64Image = imageFile.url.split(',')[1];
          } else {
            const res = await fetch(imageFile.url);
            const blob = await res.blob();
            base64Image = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(blob);
            });
          }
        } catch (err) {
          console.error("[Image Edit] Data conversion failed:", err);
        }

        // Use apiService
        const responseData = await apiService.editImage(prompt, null, base64Image);

        if (responseData && responseData.data) {
          const finalUrl = responseData.data;
          const editMessage = {
            id: tempId,
            role: 'model',
            isGenerating: false,
            content: `✨ Your image has been edited!`,
            imageUrl: finalUrl,
            timestamp: new Date(),
          };

          setMessages(prev => prev.map(msg => msg.id === tempId ? editMessage : msg));
          handleRemoveFile(); // SUCCESS - remove files now
          toast.success('Image edited successfully!');
          refreshSubscription();

          // Save AI response to backend
          if (activeSessionId && activeSessionId !== 'new') {
            chatStorageService.saveMessage(activeSessionId, editMessage).catch(err => console.error("Error saving edited image results:", err));
          }
        }
      } catch (error) {
        console.error("Image Edit Error:", error);
        const errorMsg = error.response?.data?.message || error.message || 'Failed to edit image';
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, content: `❌ ${errorMsg}` } : msg));
        handleRemoveFile(); // Clean up on error too
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Image editing error:', error);
      toast.error('Error initiating image editing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!checkLimitLocally('deepSearch')) {
      return;
    }
    try {
      if (!inputRef.current?.value.trim()) {
        toast.error('Please enter a topic for deep search');
        return;
      }

      const query = inputRef.current.value;
      setIsLoading(true);

      // Show a message that deep search is in progress
      const newMessage = {
        id: Date.now().toString(),
        role: 'model',
        isGenerating: true,
        content: `🔍 Performing deep search for: "${query}"\n\nSearching the web and analyzing results... This may take a moment...`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newMessage]);
      inputRef.current.value = '';

      try {
        // Send message with deep search context
        const responseData = await generateChatResponse(
          messages,
          query,
          "DEEP SEARCH MODE ENABLED: Analyze the web search results comprehensively.",
          [],
          currentLang
        );

        if (responseData && responseData.reply) {
          // Add the deep search result
          const searchMessage = {
            id: Date.now().toString(),
            type: 'ai',
            text: responseData.reply,
            content: responseData.reply,
            timestamp: new Date(),
          };

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = searchMessage;
            return updated;
          });

          toast.success('Deep search completed!');
          refreshSubscription();
        }
      } catch (error) {
        const errorMsg = error.message || 'Failed to perform deep search';
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...lastMsg,
            isGenerating: false,
            content: `❌ ${errorMsg}`
          };
          return updated;
        });
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Deep search error:', error);
      toast.error('Error initiating deep search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = (modelId) => {
    if (selectedToolType) {
      setToolModels(prev => ({
        ...prev,
        [selectedToolType]: modelId
      }));
      const selectedModel = TOOL_PRICING[selectedToolType].models.find(m => m.id === modelId);
      toast.success(`Switched to ${selectedModel?.name}`);
      setIsModelSelectorOpen(false);
    }
  };

  // Voice Input Handler
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      isManualStopRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Start New Listening session
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    isManualStopRef.current = false;
    transcriptRef.current = '';

    const langMap = {
      'Hindi': 'hi-IN',
      'English': 'en-US',
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Japanese': 'ja-JP'
    };
    recognition.lang = langMap[currentLang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInputValue(transcript);
      transcriptRef.current = transcript;
    };

    recognition.onend = () => {
      setIsListening(false);

      const text = transcriptRef.current.trim();
      if (!isManualStopRef.current && text) {
        voiceUsedRef.current = true;
        handleSendMessage(null, text);
      }
      isManualStopRef.current = false;
    };

    recognition.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
      isManualStopRef.current = true;
      if (event.error === 'not-allowed') toast.error('Microphone access denied');
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  // Ensure Chat Mic stops when Live Mode starts
  useEffect(() => {
    if (isLiveMode && isListening && recognitionRef.current) {
      console.log("[Chat] Stopping Mic for Live Mode");
      isManualStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isLiveMode, isListening]);

  // Helper to clean markdown for TTS
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(null);
  const audioRef = useRef(null);
  const audioCacheRef = useRef({});

  // Helper to clean markdown for TTS
  const cleanTextForTTS = (text) => {
    if (!text) return "";
    // Remove emojis using regex range for various emoji blocks
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F0F5}\u{1F200}-\u{1F270}]/gu, '')
      // Remove headers (keep text): ### Title -> Title
      .replace(/^#+\s+/gm, '')
      // Remove bold: **text** -> text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic: *text* -> text
      .replace(/\*(.*?)\*/g, '$1')
      // Remove underline: __text__ -> text
      .replace(/__(.*?)__/g, '$1')
      // Remove strikethrough: ~~text~~ -> text
      .replace(/~~(.*?)~~/g, '$1')
      // Remove links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images: ![alt](url) -> empty
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove code blocks (replace with brief pause/text to avoid reading syntax)
      .replace(/`{3}[\s\S]*?`{3}/g, ' Code snippet. ')
      // Remove inline code ticks: `text` -> text
      .replace(/`(.+?)`/g, '$1')
      // Remove list bullets: - text -> text
      .replace(/^\s*[-*+]\s+/gm, '')
      // Remove blockquotes: > text -> text
      .replace(/^\s*>\s+/gm, '')
      // Replace Trademark with 'tm' so it's handled by next step
      .replace(/™|&trade;/g, ' tm ')
      .replace(/©/g, ' ')
      // Hinglish Normalization for natural Hindi pronunciation
      // Ensure 'tm' is spoken as 'tum' clearly (NOT HIDDEN)
      .replace(/\btm\b/gi, 'tum ')
      .replace(/\bkkrh\b/gi, 'kya kar rahe ho ')
      .replace(/\bclg\b/gi, 'college ')
      .replace(/\bplz\b/gi, 'please ')
      // Remove specific symbols as requested: , . ? ; " \ * / + - : @ [ ] ( ) | _
      .replace(/[,\.\?;\"\\\*\/\+\-:@\[\]\(\)\|\_]/g, ' ')
      // Remove quotes/dashes just in case regex above missed something or for extra safety
      .replace(/["']/g, '')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Voice Queue Ref
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const currentSpeechResolverRef = useRef(null);

  // Internal function to execute speech
  const executeSpeak = async (text, language, msgId, attachments = []) => {
    return new Promise(async (resolve) => {
      // Store resolve to allow external cancellation
      currentSpeechResolverRef.current = resolve;

      // Reset State Logic used to be here, now handled by queue manager

      try {
        let audioBlob = null;
        let targetLang = 'en-US';

        const readableAttachment = attachments && attachments.length > 0
          ? attachments.find(a =>
          (a.type && (
            a.type.includes('pdf') ||
            a.type.includes('word') ||
            a.type.includes('document') ||
            a.type.includes('text') ||
            a.type.startsWith('image/')
          ))
          ) : null;

        // Check Cache
        if (msgId && audioCacheRef.current[msgId]) {
          console.log(`[VOICE] Using cached audio for: ${msgId}`);
          audioBlob = audioCacheRef.current[msgId];
        } else {
          // Not cached, fetch
          if (readableAttachment) {
            toast.loading("Processing file & text...", { id: 'voice-loading' });
            console.log(`[VOICE] Reading attachment: ${readableAttachment.name}`);

            const fileRes = await fetch(readableAttachment.url);
            const fileBlob = await fileRes.blob();

            const base64Data = await new Promise((res) => {
              const reader = new FileReader();
              reader.onloadend = () => res(reader.result.split(',')[1]);
              reader.readAsDataURL(fileBlob);
            });

            const headerText = text ? cleanTextForTTS(text) : "";

            const response = await axios.post(apis.synthesizeFile, {
              fileData: base64Data,
              mimeType: readableAttachment.type || 'application/pdf',
              languageCode: null,
              gender: 'FEMALE',
              introText: headerText
            }, {
              responseType: 'arraybuffer',
              headers: { Authorization: `Bearer ${getUserData()?.token}` }
            });

            audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            toast.dismiss('voice-loading');

          } else {
            if (!text) {
              resolve();
              return;
            }

            const cleanText = cleanTextForTTS(text);
            if (!cleanText) {
              resolve();
              return;
            }

            const langMap = {
              'Hindi': 'hi-IN',
              'English': 'en-US',
              'Hinglish': 'hi-IN'
            };
            targetLang = /[\u0900-\u097F]/.test(cleanText) ? 'hi-IN' : (langMap[language] || 'en-US');

            // Show loading for normal TTS too
            toast.loading("Generating voice...", { id: 'voice-loading' });

            const response = await axios.post(apis.synthesizeVoice, {
              text: cleanText,
              languageCode: targetLang,
              gender: 'FEMALE',
              tone: 'conversational'
            }, {
              responseType: 'arraybuffer',
              headers: { Authorization: `Bearer ${getUserData()?.token}` }
            });

            toast.dismiss('voice-loading');
            audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
          }

          // Save to Cache
          if (msgId && audioBlob) {
            audioCacheRef.current[msgId] = audioBlob;
          }
        }

        // Check if user stopped/switched while we were fetching
        if (currentSpeechResolverRef.current && currentSpeechResolverRef.current !== resolve) {
          console.log('[VOICE] Aborted playback - new task started');
          resolve();
          return;
        }

        // DOUBLE CHECK: Stop any existing audio before playing new one
        if (window.currentAudio) {
          window.currentAudio.pause();
          window.currentAudio = null;
        }

        const url = window.URL.createObjectURL(audioBlob);
        const audio = new Audio(url);

        window.currentAudio = audio;
        audioRef.current = audio;

        audio.onended = () => {
          window.URL.revokeObjectURL(url);
          if (window.currentAudio === audio) window.currentAudio = null;
          if (audioRef.current === audio) audioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error(`[VOICE] Audio playback error:`, e);
          if (!readableAttachment) fallbackSpeak(cleanTextForTTS(text), targetLang);
          resolve();
        };

        await audio.play();

      } catch (err) {
        console.error('[VOICE] Synthesis failed:', err);
        toast.dismiss('voice-loading');
        // fallback logic...
        if (!attachments || attachments.length === 0) {
          // simple fallback
          // fallbackSpeak(...)
        }
        resolve();
      }
    });
  };

  const processSpeechQueue = async () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;

    isSpeakingRef.current = true;
    const task = speechQueueRef.current[0];

    setSpeakingMessageId(task.msgId);
    setIsPaused(false);

    try {
      await executeSpeak(task.text, task.language, task.msgId, task.attachments);
    } catch (e) {
      console.error(e);
    } finally {
      // Completed (or stopped)
      if (speechQueueRef.current.length > 0 && speechQueueRef.current[0] === task) {
        speechQueueRef.current.shift(); // Remove finished
      }
      isSpeakingRef.current = false;
      currentSpeechResolverRef.current = null;

      if (speechQueueRef.current.length > 0) {
        processSpeechQueue();
      } else {
        setSpeakingMessageId(null);
      }
    }
  };

  const stopCurrentSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.currentAudio) {
      window.currentAudio.pause();
      window.currentAudio = null;
    }
    window.speechSynthesis.cancel();

    // Resolve any pending promise
    if (currentSpeechResolverRef.current) {
      currentSpeechResolverRef.current();
      currentSpeechResolverRef.current = null;
    }
  };

  // Voice Output - Speak AI Response
  const speakResponse = async (text, language, msgId, attachments = [], force = false) => {
    // 1. Handle Toggle on the SAME message (Manual Click)
    // 1. Handle Toggle on the SAME message (Manual Click)
    if (force && speakingMessageId === msgId) {
      const activeAudio = audioRef.current || window.currentAudio;
      if (activeAudio) {
        if (!activeAudio.paused) {
          console.log(`[VOICE] Pausing message: ${msgId}`);
          activeAudio.pause();
          setIsPaused(true);
          return;
        } else {
          console.log(`[VOICE] Resuming message: ${msgId}`);
          await activeAudio.play();
          setIsPaused(false);
          return;
        }
      }
    }

    // 2. Force Mode (Manual Click on DIFFERENT message)
    if (force) {
      console.log(`[VOICE] Force playing new message: ${msgId}`);
      // Stop everything immediately
      stopCurrentSpeech();
      isSpeakingRef.current = false;

      // Clear queue
      speechQueueRef.current = [];

      // Add new task
      speechQueueRef.current.push({ text, language, msgId, attachments });

      // Start processing immediately
      processSpeechQueue();
      return;
    }

    // 3. Normal Enqueue (Auto-play flow)
    speechQueueRef.current.push({ text, language, msgId, attachments });
    if (!isSpeakingRef.current) {
      processSpeechQueue();
    }
  };

  const fallbackSpeak = (text, lang) => {
    console.log(`[VOICE] Using browser fallback for: ${lang}`);
    if (!window.speechSynthesis) {
      console.error('[VOICE] SpeechSynthesis not supported in this browser.');
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Find a better voice if possible
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      console.log(`[VOICE] Browser fallback using voice: ${matchedVoice.name}`);
    }

    utterance.onstart = () => console.log('[VOICE] Browser speech started.');
    utterance.onend = () => console.log('[VOICE] Browser speech ended.');
    utterance.onerror = (e) => console.error('[VOICE] Browser speech error:', e);

    window.speechSynthesis.speak(utterance);
  };


  useEffect(() => {
    const loadSessions = async () => {
      const data = await chatStorageService.getSessions();
      setSessions(data);

      // Fetch User Subscribed Agents
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || user?._id;
        if (userId) {
          try {
            const token = getUserData()?.token || localStorage.getItem("token");
            const res = await axios.post(apis.getUserAgents, { userId }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const agents = res.data?.agents || [];
            // Add default AISA agent if not present
            const processedAgents = [{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA_BRAIN_LOGO.png' }, ...agents];
            setUserAgents(processedAgents);
          } catch (agentErr) {
            // Silently use defaults if fetch fails (no console warning)
            setUserAgents([{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA_BRAIN_LOGO.png' }]);
          }
        } else {
          // No user logged in, use default
          setUserAgents([{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA_BRAIN_LOGO.png' }]);
        }
      } catch (err) {
        // Silently handle errors
        setUserAgents([{ agentName: 'AISA', category: 'General', avatar: '/AGENTS_IMG/AISA_BRAIN_LOGO.png' }]);
      }
    };
    loadSessions();
  }, [messages, setSessions]);

  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const initChat = async () => {
      // If we just navigated from 'new' to a real ID in handleSendMessage,
      // don't clear the messages we already have in state.
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        return;
      }

      if (sessionId && sessionId !== 'new') {
        setCurrentSessionId(sessionId);
        console.log(`[DEBUG] Initializing chat for session: ${sessionId}`);
        const history = await chatStorageService.getHistory(sessionId);
        console.log(`[DEBUG] Received history:`, history);

        // Regenerate Blob URLs for audio conversions on load
        const processedHistory = (history || []).map(msg => {
          if (msg.conversion && msg.conversion.file) {
            try {
              // Only create if we don't have a CURRENT valid blob URL
              // (URLs stored in DB are strings that are invalid on reload)
              const byteChars = atob(msg.conversion.file);
              const byteNums = new Array(byteChars.length);
              for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
              const byteArray = new Uint8Array(byteNums);
              const blob = new Blob([byteArray], { type: msg.conversion.mimeType || 'audio/mpeg' });
              msg.conversion.blobUrl = URL.createObjectURL(blob);
            } catch (e) { console.error("Blob recovery failed:", e); }
          }
          return msg;
        });

        if (processedHistory && processedHistory.length > 0) {
          console.log(`[DEBUG] First message role: ${processedHistory[0].role}, content preview: ${processedHistory[0].content?.substring(0, 20)}`);
        }
        setMessages(processedHistory);
      } else {
        setCurrentSessionId('new');

        // --- SMART WELCOME ---
        const user = getUserData();
        if (user && user.token) {
          try {
            const res = await axios.get(`${apis.baseUrl}/api/memory`, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            const mem = res.data;
            setMemoryRecoil(mem);

            if (mem && mem.isMemoryEnabled) {
              const name = mem.name || user.name || "friend";
              const business = mem.businessType;

              // If critical info is missing, show onboarding
              if (!mem.name && !mem.businessType && sessionId === 'new') {
                setShowOnboarding(true);
              }

              let greeting = `Hello ${name}! 👋 Welcome back. `;
              if (business) greeting += `How is everything going with your ${business} work? `;
              greeting += "I've loaded your context and I'm ready to assist. What can we achieve today?";

              setMessages([{
                id: 'welcome-' + Date.now(),
                role: 'model',
                content: greeting,
                timestamp: new Date()
              }]);
            } else {
              setMessages([]);
            }
          } catch (e) {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }

      setShowHistory(false);
    };
    initChat();
  }, [sessionId]);

  const chatContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Increased threshold (250px) to be less sensitive to minor scroll movements or large images
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;
      shouldAutoScrollRef.current = isNearBottom;
    }
  };

  const scrollToBottom = (force = false, behavior = 'auto') => {
    if ((force || shouldAutoScrollRef.current) && chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      const maxScrollTop = scrollHeight - clientHeight;
      if (behavior === 'smooth') {
        chatContainerRef.current.scrollTo({ top: maxScrollTop, behavior: 'smooth' });
      } else {
        chatContainerRef.current.scrollTop = maxScrollTop;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = async () => {
    navigate('/dashboard/chat/new');
    setShowHistory(false);
  };

  const { language: currentLang, t } = useLanguage();

  const handleDriveClick = () => {
    setIsAttachMenuOpen(false);
    // Simulating Drive Integration via Link
    const link = prompt("Paste your Google Drive File Link:");
    if (link) {
      setFilePreviews(prev => [...prev, {
        url: link,
        name: "Google Drive File",
        type: "application/vnd.google-apps.file",
        size: 0,
        isLink: true,
        id: Math.random().toString(36).substr(2, 9)
      }]);
      setSelectedFiles(prev => [...prev, { name: "Google Drive File", type: "link" }]);
    }
  };

  const isSendingRef = useRef(false);

  const handleSendMessage = async (e, overrideContent) => {
    if (e) e.preventDefault();

    // Prevent duplicate sends
    if (isSendingRef.current) return;

    const contentToSend = typeof overrideContent === 'string' ? overrideContent : inputValue.trim();
    if ((!contentToSend && filePreviews.length === 0) || isLoading) return;

    // --- Proactive Magic Tool Activation Check ---
    const lowerContent = contentToSend.toLowerCase();
    const magicTools = [
      {
        id: 'image',
        name: 'Generate Image',
        active: isImageGeneration,
        check: () => (lowerContent.includes('image') || lowerContent.includes('photo') || lowerContent.includes('pic') || lowerContent.includes('draw')) &&
          (lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make') || lowerContent.includes('show'))
      },
      {
        id: 'video',
        name: 'Generate Video',
        active: isVideoGeneration,
        check: () => lowerContent.includes('video') && (lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make'))
      },
      {
        id: 'deepsearch',
        name: 'Deep Search',
        active: isDeepSearch,
        check: () => lowerContent.includes('deep search') || lowerContent.includes('research')
      },
      {
        id: 'websearch',
        name: 'Real-Time Web Search',
        active: isWebSearch,
        check: () => lowerContent.includes('search the web') || lowerContent.includes('live data') || lowerContent.includes('current news') || lowerContent.includes('aaj ki') || lowerContent.includes('latest')
      },
      {
        id: 'audio',
        name: 'Convert to Audio',
        active: isAudioConvertMode,
        check: () => lowerContent.includes('convert to audio') || (lowerContent.includes('read this') && lowerContent.length < 50)
      },
      {
        id: 'document',
        name: 'Convert Documents',
        active: isDocumentConvert,
        check: () => lowerContent.includes('convert document') || lowerContent.includes('pdf to word') || lowerContent.includes('word to pdf')
      },
      {
        id: 'code',
        name: 'Code Writer',
        active: isCodeWriter,
        check: () => lowerContent.includes('write code') || lowerContent.includes('fix code') || lowerContent.includes('debug code')
      }
    ];

    for (const tool of magicTools) {
      if (!tool.active && tool.check()) {
        toast.error(`Please activate "${tool.name}" from Magic Tools. (Is feature ko active karo)`, {
          duration: 4000,
          position: 'top-center'
        });
        setIsToolsMenuOpen(true);
        return;
      }
    }

    // --- Subscription Limit Checks ---
    let featureToTrack = 'chat';
    if (isDeepSearch) featureToTrack = 'deepSearch';
    else if (isWebSearch) featureToTrack = 'webSearch';
    else if (isDocumentConvert) featureToTrack = 'document';
    else if (isCodeWriter) featureToTrack = 'codeWriter';

    if (!checkLimitLocally(featureToTrack)) {
      // Limit reached, UpgradeModal will be triggered by SubscriptionContext
      return;
    }

    if (isAudioConvertMode && !contentToSend && selectedFiles.length === 0) {
      toast.error('Please enter text or upload a file to convert to audio');
      return;
    }

    if (isDocumentConvert && selectedFiles.length === 0) {
      toast.error('Please upload a PDF or DOCX file to convert');
      return;
    }

    // Special case for Audio Convert Mode: Handle files directly if present
    if (isAudioConvertMode && selectedFiles.length > 0) {
      let activeSessionId = currentSessionId;
      if (activeSessionId === 'new') {
        activeSessionId = await chatStorageService.createSession();
        setCurrentSessionId(activeSessionId);
        isNavigatingRef.current = true;
        navigate(`/dashboard/chat/${activeSessionId}`, { replace: true });
      }
      const fileToConvert = selectedFiles[0];
      manualFileToAudioConversion(fileToConvert, activeSessionId);
      setSelectedFiles([]);
      setFilePreviews([]);
      return;
    }

    // Special case for Audio Convert Mode: Handle text conversion
    if (isAudioConvertMode && contentToSend) {
      let activeSessionId = currentSessionId;
      if (activeSessionId === 'new') {
        activeSessionId = await chatStorageService.createSession();
        setCurrentSessionId(activeSessionId);
        isNavigatingRef.current = true;
        navigate(`/dashboard/chat/${activeSessionId}`, { replace: true });
      }
      manualTextToAudioConversion(contentToSend, activeSessionId);
      setInputValue('');
      return;
    }

    isSendingRef.current = true;
    setInputValue('');
    transcriptRef.current = '';

    let activeSessionId = currentSessionId;
    let isFirstMessage = false;

    // Stop listening if send is clicked
    if (isListening && recognitionRef.current) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Create or find session
    if (activeSessionId === 'new') {
      try {
        activeSessionId = await chatStorageService.createSession();
        setCurrentSessionId(activeSessionId);
        isFirstMessage = true;
      } catch (err) {
        console.error("Failed to create session:", err);
        toast.error('Failed to start a new chat session');
        isSendingRef.current = false;
        return;
      }
    }

    // Handle Image Generation Mode
    if (isImageGeneration) {
      handleGenerateImage(contentToSend, activeSessionId);
      isSendingRef.current = false;
      return;
    }

    // Handle Video Generation Mode
    if (isVideoGeneration) {
      handleGenerateVideo(contentToSend, activeSessionId);
      isSendingRef.current = false;
      return;
    }

    // Handle Image Editing Mode
    if (isMagicEditing) {
      handleEditImage(contentToSend, activeSessionId);
      isSendingRef.current = false;
      return;
    }

    // Handle Voice Reader Mode - Just read, no AI response
    if (isVoiceMode) {
      try {
        // 1. Add User Message to UI
        const userMsgId = Date.now().toString();
        const newUserMsg = {
          id: userMsgId,
          role: 'user',
          content: contentToSend,
          timestamp: new Date(),
          attachments: filePreviews.map(fp => ({
            url: fp.url,
            name: fp.name,
            type: fp.type.startsWith('image/') ? 'image' :
              fp.type.includes('pdf') ? 'pdf' :
                fp.type.includes('word') || fp.type.includes('document') ? 'docx' : 'file'
          }))
        };
        setMessages(prev => [...prev, newUserMsg]);

        // 2. Clear inputs
        setInputValue('');
        handleRemoveFile();
        if (inputRef.current) inputRef.current.style.height = 'auto';

        // 3. Trigger voice reading directly (no AI response)
        setTimeout(() => {
          console.log('[Voice Mode] Reading content with attachments:', newUserMsg.attachments);
          speakResponse(contentToSend, 'en-US', userMsgId, newUserMsg.attachments);
        }, 300);

        isSendingRef.current = false;
        return; // STOP - Don't call AI API
      } catch (err) {
        console.error('[Voice Mode Error]:', err);
        toast.error('Failed to read content');
        isSendingRef.current = false;
        return;
      }
    }


    try {
      if (activeSessionId === 'new') {
        activeSessionId = await chatStorageService.createSession();
        isFirstMessage = true;
      }

      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: contentToSend || (filePreviews.length > 0 ? (isDocumentConvert ? "Convert this document" : "Analyze these files") : ""),
        timestamp: Date.now(),
        attachments: filePreviews.map(p => ({
          url: p.url,
          name: p.name,
          type: p.type.startsWith('image/') ? 'image' :
            p.type.includes('pdf') ? 'pdf' :
              p.type.includes('word') || p.type.includes('document') ? 'docx' :
                p.type.includes('excel') || p.type.includes('spreadsheet') ? 'xlsx' :
                  p.type.includes('powerpoint') || p.type.includes('presentation') ? 'pptx' : 'file'
        })),
        agentName: activeAgent.agentName || activeAgent.name,
        agentCategory: activeAgent.category
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      scrollToBottom(true, 'smooth'); // Force smooth scroll for user message
      setInputValue('');

      // Capture mode states before resetting
      const deepSearchActive = isDeepSearch;
      if (isDeepSearch) setIsDeepSearch(false);
      const documentConvertActive = isDocumentConvert;
      if (isDocumentConvert) setIsDocumentConvert(false);
      const webSearchActive = isWebSearch;
      if (isWebSearch) setIsWebSearch(false);

      // Detect mode for UI indicator
      const detectedMode = deepSearchActive ? MODES.DEEP_SEARCH :
        (documentConvertActive ? MODES.DOCUMENT_CONVERT :
          (webSearchActive ? MODES.WEB_SEARCH :
            detectMode(contentToSend, userMsg.attachments)));
      setCurrentMode(detectedMode);

      // Update user message with the detected mode
      userMsg.mode = detectedMode;

      // Determine loading intent for UI feedback
      const lowerContent = (userMsg.content || "").toLowerCase();
      if (
        (lowerContent.includes('image') || lowerContent.includes('photo') || lowerContent.includes('pic') || lowerContent.includes('draw')) &&
        (lowerContent.includes('generate') || lowerContent.includes('create') || lowerContent.includes('make') || lowerContent.includes('show'))
      ) {
        setLoadingText("Generating Image... 🎨");
      } else if (lowerContent.includes('video')) {
        setLoadingText("Generating Video... 🎥");
      } else if (documentConvertActive) {
        setLoadingText("Converting Document... 🔄");
      } else if (
        lowerContent.includes('news') ||
        lowerContent.includes('price') ||
        lowerContent.includes('score') ||
        lowerContent.includes('weather') ||
        lowerContent.includes('latest') ||
        lowerContent.includes('current') ||
        lowerContent.includes('aaj') ||
        lowerContent.includes('date') ||
        lowerContent.includes('time') ||
        lowerContent.includes('samay') ||
        lowerContent.includes('tareekh') ||
        lowerContent.includes('rate') ||
        lowerContent.includes('bhav')
      ) {
        setLoadingText("Searching the web... 🌐");
      } else {
        setLoadingText("Thinking...");
      }

      handleRemoveFile(); // Clear file after sending
      setIsLoading(true);

      try {
        const title = isFirstMessage ? (userMsg.content ? userMsg.content.slice(0, 30) : 'File Attachment') + '...' : undefined;
        await chatStorageService.saveMessage(activeSessionId, userMsg, title);

        if (isFirstMessage) {
          isNavigatingRef.current = true;
          setCurrentSessionId(activeSessionId);
          navigate(`/dashboard/chat/${activeSessionId}`, { replace: true });
        }

        // Send to AI for response
        const caps = getAgentCapabilities(activeAgent.agentName, activeAgent.category);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // ---------------------------------------------------------
        //  CONSTRUCT SYSTEM INSTRUCTION BASED ON PROFILE SETTINGS
        // ---------------------------------------------------------
        const pGeneral = personalizations?.general || {};
        const pStyle = personalizations?.personalization || {};
        const pParental = personalizations?.parentalControls || {};

        let PERSONA_INSTRUCTION = "";

        // 1. STYLE & FONT (Font is UI only, but we can hint at TONE)
        if (pStyle.fontStyle && pStyle.fontStyle !== 'Default') {
          // No direct AI instruction needed for font family, but we can adjust tone if needed
        }

        // 2. CHARACTERISTICS
        if (pStyle.enthusiasm) PERSONA_INSTRUCTION += `- Enthusiasm Level: ${pStyle.enthusiasm}\n`;
        if (pStyle.formality) PERSONA_INSTRUCTION += `- Formality Level: ${pStyle.formality}\n`;
        if (pStyle.creativity) PERSONA_INSTRUCTION += `- Creativity Level: ${pStyle.creativity}\n`;

        // 3. FORMATTING
        if (pStyle.structuredResponses) PERSONA_INSTRUCTION += "- FORMAT: Use clear Headers, Sections, and structured layouts.\n";
        if (pStyle.bulletPoints) PERSONA_INSTRUCTION += "- FORMAT: Prioritize Bullet Points and Lists over paragraphs.\n";

        // 4. EMOJI USAGE
        if (pStyle.emojiUsage) {
          if (pStyle.emojiUsage === 'None') PERSONA_INSTRUCTION += "- EMOJIS: Do NOT use any emojis or icons.\n";
          else if (pStyle.emojiUsage === 'Minimal') PERSONA_INSTRUCTION += "- EMOJIS: Use very few emojis, only where absolutely necessary.\n";
          else if (pStyle.emojiUsage === 'Moderate') PERSONA_INSTRUCTION += "- EMOJIS: Use a moderate amount of relevant emojis.\n";
          else if (pStyle.emojiUsage === 'Expressive') PERSONA_INSTRUCTION += "- EMOJIS: Use emojis frequently to be engaging and expressive.\n";
        }

        // 5. CUSTOM INSTRUCTIONS override
        if (pStyle.customInstructions) {
          PERSONA_INSTRUCTION += `\n### USER CUSTOM INSTRUCTIONS (HIGHEST PRIORITY):\n${pStyle.customInstructions}\n`;
        }

        // 6. PARENTAL / SAFETY
        if (pParental.contentFilter) {
          PERSONA_INSTRUCTION += `\n### SAFETY MODE: STRICT\n- Absolutely NO mature, violent, or explicit content.\n- If user asks for such, politley decline.\n`;
        }
        if (pParental.ageCategory === 'Child') {
          PERSONA_INSTRUCTION += `- SIMPLIFY language for a Child.\n- Be encouraging and safe.\n`;
        }

        // 7. LANGUAGE
        // We already have language detection, but let's reinforce if set strictly
        if (pGeneral.language && pGeneral.language !== 'Auto-Detect') {
          PERSONA_INSTRUCTION += `\n### REQUIRED LANGUAGE:\n- Respond ONLY in ${pGeneral.language}.\n`;
        }

        // 8. TEXT SIZE / ACCESSIBILITY (Frontend only mostly, but hint AI)
        if (pStyle.fontSize === 'Large' || pStyle.fontSize === 'Extra Large' || pGeneral.highContrast) {
          PERSONA_INSTRUCTION += `- FORMAT: Use shorter sentences and very clear structure for readability.\n`;
        }

        const SYSTEM_INSTRUCTION = `
You are AISA™, the official AI assistant of the AISA™ platform. Powered by A-Series.
${activeAgent.category ? `Your specialization is in ${activeAgent.category}.` : ''}

### CRITICAL BRAND RULE:
Whenever a user mentions "AISA", "AISA AI", "AISA app", "your image", "your video", "AISA image", "AISA video", or refers to AISA in third person, you MUST interpret it as referring to THIS platform (AISA™ brand identity), not a generic artificial intelligence.

### SELF-REFERENCE DETECTION & CONTENT GENERATION:
1. If user says:
   - "Generate AISA image", "Create image of AISA", "Make AISA logo", "AISA ka photo banao", "AISA ka video generate karo", "Your intro video banao", "AISA introduction video"
   → You must generate content representing the official AISA™ brand.

2. AISA Brand Identity:
   - Futuristic AI assistant
   - Glowing blue/purple neural brain logo
   - Modern, premium, intelligent
   - Clean UI dashboard style
   - Advanced AI Super Assistant
   - Indian tech startup vibe (global level)

3. If user asks for:
   - Image → Generate/Ask for a brand-based promotional visual
   - Video → Generate/Ask for a cinematic AI intro script for AISA™
   - Logo → Generate/Ask for a modern AI tech logo concept
   - Poster → Promotional marketing poster content
   - Reel → Social media promotional script

4. Never treat “AISA” as a random AI. Always treat it as THIS official platform.

5. If user intent is unclear, ask: "Are you referring to the official AISA™ platform?"

${PERSONA_INSTRUCTION}

### CRITICAL LANGUAGE RULE:
**ALWAYS respond in the SAME LANGUAGE as the user's message.** (Unless overridden by settings)
- If user writes in HINDI (Devanagari or Romanized), respond in HINDI.
- If user writes in ENGLISH, respond in ENGLISH.
- If user mixes languages, prioritize the dominant language.

### RESPONSE BEHAVIOR:
- Answer the user's question directly without greeting messages
- Do NOT say "Hello... welcome to AISA" or similar greetings
- Focus ONLY on providing the answer to what user asked
- Be helpful, clear, and concise

### STREAMING BEHAVIOR:
- Generate responses in smooth, continuous stream
- Use short paragraphs for readability
- If interrupted, stop immediately without completing sentence
- Do NOT add summaries or closing lines after interruption
- Resume ONLY if user explicitly asks again

### MULTI-FILE ANALYSIS MANDATE (STRICT 1:1 RULE):
You have received exactly ${filePreviews.length} file(s).
You MUST provide exactly ${filePreviews.length} distinct analysis blocks.

CRITICAL RULES:
1.  **NO MERGING**: Do NOT combine files into a single "Chapter" or "Section".
2.  **NO SKIPPING**: If 2 files are uploaded, you MUST output 2 analysis blocks.
3.  **SEPARATE ENTITIES**: Treat each file as a completely independent document requiring its own full answer.
4.  **DELIMITER MANDATORY**: Use the delimiter below to separate EACH file's answer.

REQUIRED OUTPUT FORMAT:
[Optional brief greeting]

---SPLIT_RESPONSE---
**Analysis of: {Filename 1}**
[Full detailed answer/analysis for File 1]

---SPLIT_RESPONSE---
**Analysis of: {Filename 2}**
[Full detailed answer/analysis for File 2]

(Repeat strictly for ALL ${filePreviews.length} files)

### RESPONSE FORMATTING RULES (STRICT):
1.  **Structure**: ALWAYS use **Bold Headings** and **Bullet Points**. Avoid long paragraphs.
2.  **Point-wise Answers**: Break down complex topics into simple points.
3.  **Highlights**: Bold key terms and important concepts.
4.  **Summary**: Include a "One-line summary" or "Simple definition" at the start or end where appropriate.
5.  **Emojis**: Use relevant emojis.

### FINANCIAL & INVOICE ANALYSIS RULES (MANDATORY):
When summarizing or extracting data from Invoices, Receipts, or Financial Documents:
1. **CRITICAL**: You MUST **bold** ALL monetary amounts (e.g., **INR 1,41,954.00**, **$500.00**).
2. **CRITICAL**: You MUST **bold** ALL Entity/Person Names (e.g., **PRAHALAD AHUJA HUF**, **Amazon Inc**).
3. **CRITICAL**: You MUST **bold** ALL Dates, Invoice Numbers, and distinct identifiers (GSTIN/PAN).
4. **Format**: Present extracted data in a clean **Bullet List** or **Table** for immediate readability.

${caps.canUploadImages ? `IMAGE ANALYSIS CAPABILITIES:
- You have the ability to see and analyze images provided by the user.` : ''}

${caps.canUploadDocs ? `DOCUMENT ANALYSIS CAPABILITIES:
- You can process and extract text from PDF, Word (Docx), and Excel files provided as attachments.` : ''}

${activeAgent.instructions ? `SPECIFIC AGENT INSTRUCTIONS:
${activeAgent.instructions}` : ''}

${deepSearchActive ? `### DEEP SEARCH MODE ENABLED (CRITICAL):
- The user has requested an EXHAUSTIVE DEEP SEARCH.
- Your response MUST be extremely long, detailed, and comprehensive.
- Provide in-depth analysis, historical context, current trends, and future implications where applicable.
- YOU MUST perform extensive web searching to gather every relevant detail.
- Do NOT be brief. Expand on every point. Use multiple sections and subsections.
- Clearly structure your findings with professional formatting and cite sources if possible.` : ''}

${documentConvertActive ? `### DOCUMENT CONVERSION MODE ENABLED (CRITICAL):
- The user wants to convert the uploaded document.
- Identify the source file format (PDF/DOCX) and the requested target format.
- IF the user does NOT specify a target format:
  - If source is PDF, suggest converting to DOCX.
  - If source is DOCX, suggest converting to PDF.
- YOU MUST provide the conversion parameters in the following JSON format:
\`\`\`json
{
  "action": "file_conversion",
  "source_format": "pdf",
  "target_format": "docx",
  "file_name": "original_filename.pdf"
}
\`\`\`
- Keep the response text brief, explaining what you are doing.` : ''}
`;
        // Default AI message sending
        const aiResponseData = await generateChatResponse(
          messages,
          userMsg.content,
          SYSTEM_INSTRUCTION + getSystemPromptExtensions(),
          userMsg.attachments,
          currentLang,
          abortControllerRef.current.signal,
          detectedMode
        );

        if (aiResponseData && aiResponseData.error === "LIMIT_REACHED") {
          setIsLimitReached(true);
          setIsLoading(false);
          isSendingRef.current = false;
          return;
        }

        // Handle response - could be string (old format) or object (new format with conversion)
        let aiResponseText = '';
        let conversionData = null;
        let aiVideoUrl = null;
        let aiImageUrl = null;
        let isRealTimeResponse = false;
        let responseSources = [];

        if (typeof aiResponseData === 'string') {
          aiResponseText = aiResponseData;
        } else if (aiResponseData && typeof aiResponseData === 'object') {
          // Compatibility with both 'reply' and 'data' properties from backend
          aiResponseText = aiResponseData.reply || aiResponseData.data || "No response generated.";
          conversionData = aiResponseData.conversion || null;
          isRealTimeResponse = aiResponseData.isRealTime || false;
          responseSources = aiResponseData.sources || [];
          // Extract media URLs if present
          aiVideoUrl = aiResponseData.videoUrl || null;
          aiImageUrl = aiResponseData.imageUrl || null;
        } else {
          aiResponseText = "Sorry, I encountered an issue while generating a response. Please try again.";
        }

        if (aiResponseText === "dbDemoModeMessage") {
          aiResponseText = t('dbDemoModeMessage');
        }

        // Check for multiple file analysis headers to split into separate cards
        const delimiter = '---SPLIT_RESPONSE---';
        let responseParts = [];

        if (aiResponseText && aiResponseText.includes(delimiter)) {
          const rawParts = aiResponseText.split(delimiter).filter(p => p && p.trim().length > 0);
          responseParts = rawParts.length > 0 ? rawParts.map(part => part.trim()) : [aiResponseText];
        } else {
          responseParts = [aiResponseText || "No response generated."];
        }

        // Process response parts and add to messages
        for (let i = 0; i < responseParts.length; i++) {
          const partContent = responseParts[i];
          if (!partContent) continue;

          const msgId = (Date.now() + 1 + i).toString();
          const modelMsg = {
            id: msgId,
            role: 'model',
            content: '', // Start empty for typewriter effect
            isRealTime: isRealTimeResponse,
            sources: responseSources,
            timestamp: Date.now() + i * 100,
          };

          // Add the empty message structure to UI
          setMessages((prev) => [...prev, modelMsg]);
          setTypingMessageId(msgId); // Mark this message as typing

          // Typewriter effect simulation
          const words = partContent.split(' ');
          let displayedContent = '';

          // Decide speed based on length (shorter = slower, longer = faster)
          const delay = words.length > 200 ? 10 : (words.length > 50 ? 20 : 35);

          for (let j = 0; j < words.length; j++) {
            // Check if generation was stopped by user
            if (!isSendingRef.current) break;

            displayedContent += (j === 0 ? '' : ' ') + words[j];

            // Update UI with the current chunk
            setMessages((prev) =>
              prev.map(m => m.id === msgId ? { ...m, content: displayedContent } : m)
            );

            // Auto-scroll as content grows
            if (j % 5 === 0) scrollToBottom();

            // Wait before next word
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          if (!isSendingRef.current) {
            setTypingMessageId(null);
            return; // Exit function if stopped
          }

          setTypingMessageId(null); // Clear typing status

          // Add conversion data and media if available
          const finalModelMsg = { ...modelMsg, content: partContent };
          if (i === 0) {
            if (conversionData) finalModelMsg.conversion = conversionData;
            if (aiVideoUrl) finalModelMsg.videoUrl = aiVideoUrl;
            if (aiImageUrl) finalModelMsg.imageUrl = aiImageUrl;
            finalModelMsg.isRealTime = isRealTimeResponse;
            finalModelMsg.sources = responseSources;
          }

          // After typing is complete, save the full message to history
          await chatStorageService.saveMessage(activeSessionId, finalModelMsg);

          // Refresh usage counts after successful generation
          refreshSubscription();

          // CRITICAL: Update the state with the final message including conversion data
          setMessages((prev) =>
            prev.map(m => m.id === msgId ? finalModelMsg : m)
          );
          scrollToBottom();

          // Speak the AI response if user used voice input
          if (i === 0 && voiceUsedRef.current) {
            const detectedLang = aiResponseData?.language || currentLang;
            speakResponse(partContent, detectedLang);
            voiceUsedRef.current = false; // Reset flag
          }
        }
      } catch (innerError) {
        console.error("Storage/API Error:", innerError);
        // Even if saving failed, we still have the local state
      }
    } catch (error) {
      // Handle abort errors silently (user stopped generation)
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        console.log('Generation stopped by user');
        // Keep partial response, don't show error
        return;
      }

      console.error("Chat Error:", error);
      toast.error(`Error: ${error.message || "Failed to send message"}`);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
      abortControllerRef.current = null; // Clean up abort controller
    }
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat history?')) {
      await chatStorageService.deleteSession(id);
      const data = await chatStorageService.getSessions();
      setSessions(data);
      if (currentSessionId === id) {
        navigate('/dashboard/chat/new');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentCapabilities = (agentName, category) => {
    const name = (agentName || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    // Default: Everything enabled for AISA
    if (name === 'aisa' || !name) {
      return {
        canUploadImages: true,
        canUploadDocs: true,
        canVoice: true,
        canVideo: true,
        canCamera: true
      };
    }

    const caps = {
      canUploadImages: true,
      canUploadDocs: true,
      canVoice: true,
      canVideo: true,
      canCamera: true
    };

    // Specific logic per category/name
    if (cat.includes('hr') || cat.includes('finance') || name.includes('doc') || name.includes('legal')) {
      caps.canVideo = false;
      caps.canCamera = false;
      caps.canUploadImages = false;
    } else if (cat.includes('design') || cat.includes('creative') || name.includes('photo')) {
      caps.canVoice = false;
      caps.canVideo = false;
      caps.canUploadDocs = false;
    } else if (name.includes('voice') || name.includes('call') || name.includes('bot')) {
      caps.canUploadImages = false;
      caps.canUploadDocs = false;
      caps.canCamera = false;
      caps.canVideo = false;
    } else if (cat.includes('medical') || cat.includes('health')) {
      caps.canVideo = false;
      caps.canUploadImages = true;
    }

    return caps;
  };

  const handleDownload = async (url, filename) => {
    if (isDownloadingUrl === url) return;
    setIsDownloadingUrl(url);
    const downloadToast = toast.loading("Preparing download...");

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'aisa-download.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started!", { id: downloadToast });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Download failed", { id: downloadToast });
      // Fallback to direct link if fetch fails
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    } finally {
      setIsDownloadingUrl(null);
    }
  };

  const handleImageAction = (action) => {
    if (selectedFiles.length === 0) return;

    let command = '';
    switch (action) {
      case 'remove-bg':
        command = 'Remove the background and clean up this image.';
        break;
      case 'remix':
        command = 'Create a stunning new image based on this attachment. Here are the details: ';
        break;
      case 'enhance':
        command = 'Analyze the attached image and generate a higher quality version of it.';
        break;
      default:
        break;
    }
    setInputValue(command);

    if (action === 'remix') {
      inputRef.current?.focus();
      toast.success("Describe your changes and hit send!");
    } else {
      toast.success(`${action.replace('-', ' ')} processing...`);
      setLoadingText(`Processing ${action.replace('-', ' ')}... 🖼️`);
      setTimeout(() => handleSendMessage(), 100);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };


  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Feedback State
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMsgId, setFeedbackMsgId] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState([]);
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [loadingText, setLoadingText] = useState("Thinking..."); // New state for loading status text
  const [messageFeedback, setMessageFeedback] = useState({}); // { [msgId]: { type: 'up' | 'down', categories: [], details: '' } }
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const toggleFeedback = (msgId, feedbackData) => {
    setMessageFeedback(prev => {
      // If it's the same type and no extra data (categories), toggle it off
      if (prev[msgId]?.type === feedbackData.type && (!feedbackData.categories || feedbackData.categories.length === 0)) {
        const { [msgId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [msgId]: feedbackData
      };
    });
  };

  const handlePdfAction = async (action, msg) => {
    // Instant Share/Copy if PDF is already pre-generated
    if ((action === 'share' || action === 'copy') && pregeneratedPdfs[msg.id]) {
      const file = pregeneratedPdfs[msg.id];

      if (action === 'copy') {
        if (!window.ClipboardItem) {
          toast.error("Iss browser mein direct file copy supported nahi hai. Download ya Share use karein.");
          return;
        }
        try {
          // Wrap in Promise for better compatibility
          const item = new ClipboardItem({
            [file.type || 'application/pdf']: Promise.resolve(file)
          });
          await navigator.clipboard.write([item]);
          toast.success("PDF file copy ho gayi! 📋 Ab aap ise WhatsApp ya folder mein paste kar sakte hain.");
          return;
        } catch (err) {
          console.error("Copy failed:", err);
          toast.error("File copy nahi ho saki. Browser file permission check karein.");
          return;
        }
      }

      // Try native share (works on mobile)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: file.name || 'AISA Document',
            text: 'Converted Document from AISA'
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User cancelled
          // Native share failed for other reason — open in new tab as fallback
        }
      }
      // Desktop / unsupported: open PDF in new tab (NO download)
      const blobUrl = URL.createObjectURL(file);
      window.open(blobUrl, '_blank');
      return;
    }

    const isPregeneration = action === 'pregenerate';
    // If we're already pre-generating, don't start another one
    if (isPregeneration && pdfLoadingId === msg.id) return;
    if (isPregeneration && pregeneratedPdfs[msg.id]) return;

    // Converted File Logic
    if (msg.conversion && msg.conversion.file && msg.conversion.mimeType === 'application/pdf') {
      const shareToastId = !isPregeneration ? toast.loading(`${action === 'share' ? 'Sharing' : 'Preparing'} PDF...`) : null;
      try {
        const byteCharacters = atob(msg.conversion.file);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const filename = msg.conversion.fileName || 'AISA.pdf';
        const file = new window.File([blob], filename, { type: 'application/pdf' });

        if (isPregeneration) {
          setPregeneratedPdfs(prev => ({ ...prev, [msg.id]: file }));
          return;
        }

        if (action === 'download') {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success("PDF Downloaded", { id: shareToastId });
        } else if (action === 'open') {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          toast.dismiss(shareToastId);
        } else if (action === 'copy') {
          if (!window.ClipboardItem) {
            toast.error("Iss browser mein direct file copy supported nahi hai.");
            toast.dismiss(shareToastId);
            return;
          }
          const item = new ClipboardItem({
            [file.type || 'application/pdf']: Promise.resolve(file)
          });
          await navigator.clipboard.write([item]);
          toast.success("PDF file copy ho gayi! 📋", { id: shareToastId });
        } else if (action === 'share') {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'AISA AI Response',
                text: msg && msg.content ? `${msg.content.substring(0, 150)}...` : 'AISA Document output'
              });
              toast.success("PDF sent to share menu!", { id: shareToastId });
            } catch (shareErr) {
              if (shareErr.name !== 'AbortError') {
                // Share failed — open in new tab instead of downloading
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                toast.dismiss(shareToastId);
              } else {
                toast.dismiss(shareToastId);
              }
            }
          } else {
            // Not supported — open in new tab (NO forced download)
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.dismiss(shareToastId);
          }
        }
        return;
      } catch (err) {
        if (shareToastId) toast.error("Failed to process PDF", { id: shareToastId });
        console.error("Error handling PDF action:", err);
      }
    }

    // Normal AI Response PDF Logic
    const processToastId = !isPregeneration ? toast.loading(`${action === 'share' ? 'Sharing' : 'Generating'} PDF Document...`) : null;
    if (!isPregeneration) setPdfLoadingId(msg.id);

    try {
      const element = document.getElementById(`msg-text-${msg.id}`);
      if (!element) {
        if (processToastId) toast.error("Content not found", { id: processToastId });
        setPdfLoadingId(null);
        return;
      }

      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const clonedEl = clonedDoc.getElementById(`msg-text-${msg.id}`);
            if (clonedEl) {
              const header = clonedDoc.createElement('div');
              header.style.marginBottom = '20px';
              header.style.paddingBottom = '10px';
              header.style.borderBottom = '1px solid #eee';
              header.style.fontSize = '12px';
              header.style.color = '#888';
              header.style.fontWeight = 'bold';
              header.innerText = 'AISA AI RESPONSE';
              clonedEl.insertBefore(header, clonedEl.firstChild);
              clonedEl.style.padding = '20px';
              clonedEl.style.color = '#000000';
              clonedEl.style.backgroundColor = '#ffffff';
              clonedEl.style.width = '800px';
              clonedEl.style.lineHeight = '1.4';
              const all = clonedEl.querySelectorAll('*');
              Array.from(all).forEach(el => {
                el.style.color = '#000000';
                if (el.tagName === 'P') el.style.marginBottom = '6px';
                if (el.tagName === 'A') el.style.color = '#0000ff';
              });
            }
          }
        });
      } catch (genError) {
        if (processToastId) toast.error(`Canvas Error: ${genError.message}`, { id: processToastId });
        setPdfLoadingId(null);
        return;
      }

      if (!canvas) {
        if (processToastId) toast.error("Failed to capture content", { id: processToastId });
        setPdfLoadingId(null);
        return;
      }

      // ===== SMART PER-PAGE CANVAS SLICING =====
      // Scans for white space near page breaks to avoid cutting text lines
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageW = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297mm
      const printW = pageW - margin * 2;
      const printH = pageH - margin * 2;

      const pxPerMm = canvas.width / printW;
      const pageHeightPx = Math.floor(printH * pxPerMm);
      const mainCtx = canvas.getContext('2d', { willReadFrequently: true });

      let currentY = 0;
      let pageCount = 0;

      while (currentY < canvas.height) {
        if (pageCount > 0) pdf.addPage();

        let targetH = pageHeightPx;
        // If not the last page, try to find a "smart" break point (white space)
        if (currentY + targetH < canvas.height) {
          // Increase scan range to found a better gap (max 200px or 1/3 of page)
          const scanRange = Math.min(200, Math.floor(pageHeightPx / 3));
          try {
            const scanData = mainCtx.getImageData(0, currentY + targetH - scanRange, canvas.width, scanRange).data;
            let foundSafeRow = -1;

            // Search from bottom of the ideal page area upwards
            for (let row = scanRange - 1; row >= 0; row--) {
              let isWhiteRow = true;
              // Sampling check every 5th pixel for better accuracy than every 10th
              for (let col = 0; col < canvas.width; col += 5) {
                const idx = (row * canvas.width + col) * 4;
                // Check if color is near white (AISA bg or transparent)
                if (scanData[idx] < 245 || scanData[idx + 1] < 245 || scanData[idx + 2] < 245) {
                  isWhiteRow = false;
                  break;
                }
              }
              if (isWhiteRow) {
                foundSafeRow = row;
                break;
              }
            }

            if (foundSafeRow !== -1) {
              // We found a gap! Slice here.
              targetH = (targetH - scanRange) + foundSafeRow + 4; // 4px extra safety buffer
            } else {
              // If no gap found, we'll have to cut through text, 
              // but let's try to avoid mid-line repetition by being exact
              targetH = pageHeightPx;
            }
          } catch (e) {
            console.warn("Smart break scan failed", e);
            targetH = pageHeightPx;
          }
        } else {
          targetH = canvas.height - currentY;
        }

        // Clip safety: ensure we don't exceed actual canvas height
        if (currentY + targetH > canvas.height) {
          targetH = canvas.height - currentY;
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = targetH;
        const pCtx = pageCanvas.getContext('2d');
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pCtx.drawImage(canvas, 0, currentY, canvas.width, targetH, 0, 0, canvas.width, targetH);

        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95); // JPEG slightly faster/smaller
        const mmH = targetH / pxPerMm;
        pdf.addImage(pageImg, 'JPEG', margin, margin, printW, mmH, undefined, 'FAST');

        currentY += targetH; // Advance by exactly what we took
        pageCount++;
      }
      // ===== END SMART SLICING =====

      const filename = `AISA.pdf`;
      const blob = pdf.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf', lastModified: new Date().getTime() });

      if (isPregeneration) {
        setPregeneratedPdfs(prev => ({ ...prev, [msg.id]: file }));
        return;
      }

      if (action === 'download') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (processToastId) toast.success("PDF Downloaded", { id: processToastId });
      } else if (action === 'open') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        if (processToastId) toast.dismiss(processToastId);
      } else if (action === 'copy') {
        if (!window.ClipboardItem) {
          toast.error("Iss browser mein direct file copy supported nahi hai.");
          if (processToastId) toast.dismiss(processToastId);
          return;
        }
        const item = new ClipboardItem({
          ['application/pdf']: Promise.resolve(blob)
        });
        await navigator.clipboard.write([item]);
        if (processToastId) toast.success("PDF file copy ho gayi! 📋", { id: processToastId });
      } else if (action === 'share') {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // On desktop, prioritize in-app WhatsApp share to avoid Windows native share login issues
        if (!isMobile) {
          handleWhatsAppPdfShare(msg);
          if (processToastId) toast.dismiss(processToastId);
          return;
        }

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'AISA AI Response',
              text: msg && msg.content ? `${msg.content.substring(0, 150)}...` : 'AISA Document output'
            });
            if (processToastId) toast.success("PDF sent to share menu!", { id: processToastId });
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              // Share failed — open in new tab instead of downloading
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
              if (processToastId) toast.dismiss(processToastId);
            } else {
              if (processToastId) toast.dismiss(processToastId);
            }
          }
        } else {
          // Fallback or specific Desktop case without navigator.share
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          if (processToastId) toast.dismiss(processToastId);
        }
      }
    } catch (err) {
      console.error(err);
      if (processToastId) toast.error("Failed to generate PDF", { id: processToastId });
    } finally {
      if (!isPregeneration) setPdfLoadingId(null);
    }
  };

  // Auto-resize chat input textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height to recount
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // ===== AUTO PRE-GENERATE PDF for latest AI message =====
  // Start PDF generation in background right after AI responds
  // so by the time user clicks the PDF icon, it's already ready (instant share!)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'model' || !lastMsg.content) return;
    if (pregeneratedPdfs[lastMsg.id]) return; // Already generated

    // Wait 1.5s for DOM to render, then silently pre-generate
    const timer = setTimeout(() => {
      handlePdfAction('pregenerate', lastMsg);
    }, 1500);

    return () => clearTimeout(timer);
  }, [messages]);

  const handleThumbsDown = (msgId) => {
    setFeedbackMsgId(msgId);
    setFeedbackOpen(true);
    setFeedbackCategory([]);
    setFeedbackDetails("");
  };

  const handleThumbsUp = async (msgId) => {
    try {
      toggleFeedback(msgId, { type: 'up' });
      await axios.post(apis.feedback, {
        sessionId: sessionId || 'unknown',
        messageId: msgId,
        type: 'thumbs_up'
      });
      toast.success("Thanks for the positive feedback!", {
        icon: '👍',
      });
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
      // Revert local state on error
      toggleFeedback(msgId, { type: 'up' });
    }
  };

  const handleShare = async (content) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Assistant Response',
          text: content,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyMessage(content);
      toast("Content copied to clipboard", { icon: '📋' });
    }
  };

  // WhatsApp In-App PDF Share — uploads PDF to cloud, then lets user pick contact IN-APP
  const handleWhatsAppPdfShare = async (msg) => {
    const toastId = toast.loading("Preparing PDF for WhatsApp...");
    try {
      // 1. Generate PDF from message
      const element = document.getElementById(`msg-text-${msg.id}`);
      if (!element) { toast.error("Content not found", { id: toastId }); return; }

      const canvas = await html2canvas(element, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(`msg-text-${msg.id}`);
          if (el) {
            const hdr = clonedDoc.createElement('div');
            hdr.style.cssText = 'margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid #eee;font-size:12px;color:#888;font-weight:bold;';
            hdr.innerText = 'AISA AI RESPONSE';
            el.insertBefore(hdr, el.firstChild);
            el.style.cssText = 'padding:20px;color:#000;background:#fff;width:800px;line-height:1.4;';
            el.querySelectorAll('*').forEach(e => { e.style.color = '#000'; });
          }
        }
      });

      // ===== SMART PER-PAGE SLICING (for WhatsApp) =====
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const printW = pageW - margin * 2;
      const printH = pageH - margin * 2;
      const pxPerMm = canvas.width / printW;
      const pageHeightPx = Math.floor(printH * pxPerMm);
      const mainCtx = canvas.getContext('2d', { willReadFrequently: true });

      let curY = 0;
      let pageIdx = 0;
      while (curY < canvas.height) {
        if (pageIdx > 0) pdf.addPage();
        let targetH = pageHeightPx;
        if (curY + targetH < canvas.height) {
          const scanRange = Math.min(200, Math.floor(pageHeightPx / 3));
          try {
            const scanData = mainCtx.getImageData(0, curY + targetH - scanRange, canvas.width, scanRange).data;
            let bestRow = -1;
            for (let r = scanRange - 1; r >= 0; r--) {
              let isWhite = true;
              for (let c = 0; c < canvas.width; c += 5) {
                const i = (r * canvas.width + c) * 4;
                if (scanData[i] < 245 || scanData[i + 1] < 245 || scanData[i + 2] < 245) {
                  isWhite = false;
                  break;
                }
              }
              if (isWhite) { bestRow = r; break; }
            }
            if (bestRow !== -1) {
              targetH = (targetH - scanRange) + bestRow + 4;
            }
          } catch (e) { }
        } else { targetH = canvas.height - curY; }

        if (curY + targetH > canvas.height) targetH = canvas.height - curY;

        const pCanvas = document.createElement('canvas');
        pCanvas.width = canvas.width;
        pCanvas.height = targetH;
        const pCtx = pCanvas.getContext('2d');
        pCtx.fillStyle = '#ffffff';
        pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
        pCtx.drawImage(canvas, 0, curY, canvas.width, targetH, 0, 0, canvas.width, targetH);
        pdf.addImage(pCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, printW, targetH / pxPerMm, undefined, 'FAST');
        curY += targetH;
        pageIdx++;
      }
      // ===== END SMART SLICING =====
      // 2. Upload PDF blob to Cloudinary via backend
      toast.loading("Uploading PDF...", { id: toastId });
      const blob = pdf.output('blob');
      const formData = new FormData();
      formData.append('pdf', blob, 'AISA.pdf');

      const { BASE_URL } = await import('../types');
      const uploadRes = await axios.post(`${BASE_URL}/api/chat/upload-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      const pdfUrl = uploadRes.data?.url;
      if (!pdfUrl) throw new Error("Upload failed");

      toast.dismiss(toastId);

      // 3. Show in-app WhatsApp contact picker modal
      setWaPdfUrl(pdfUrl);
      setWaMsgContent(`🤖 *AISA AI Response*\n\nYeh dekho meri AISA se baat: ${pdfUrl}`);
      setWaPhone('');
      setWaShareModal(true);

    } catch (err) {
      console.error("WhatsApp PDF Share error:", err);
      toast.error("WhatsApp share failed. Try again.", { id: toastId });
    }
  };

  const sendWhatsAppMessage = () => {
    const cleaned = waPhone.replace(/\D/g, '');
    if (cleaned.length < 7) { toast.error("Valid phone number daalo!"); return; }

    setWaUploading(true);
    const text = encodeURIComponent(waMsgContent);

    // Using api.whatsapp.com directly as it's more reliable for session persistence on desktop
    // Removing noreferrer to ensure cookies/sessions are shared correctly between windows
    const url = `https://api.whatsapp.com/send?phone=${cleaned}&text=${text}`;

    try {
      const win = window.open(url, '_blank', 'noopener');
      if (win) {
        win.focus();
        toast.success("WhatsApp mein message open ho gaya! 📤");
      } else {
        // Fallback for popup blockers
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.click();
        toast.success("WhatsApp opening... Check popups!");
      }
    } catch (err) {
      console.error("WhatsApp redirection error:", err);
      toast.error("Naya window nahi khul saka.");
    } finally {
      setWaUploading(false);
      setWaShareModal(false);
    }
  };

  const submitFeedback = async () => {
    if (isSubmittingFeedback) return;
    try {
      setIsSubmittingFeedback(true);
      const msgId = feedbackMsgId;
      const feedbackData = {
        type: 'down',
        categories: [...feedbackCategory],
        details: feedbackDetails
      };

      await axios.post(apis.feedback, {
        sessionId: sessionId || 'unknown',
        messageId: msgId,
        type: 'thumbs_down',
        categories: feedbackData.categories,
        details: feedbackData.details
      });

      toggleFeedback(msgId, feedbackData);
      toast.success("Feedback submitted. Thank you!");
      setFeedbackOpen(false);
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const toggleFeedbackCategory = (cat) => {
    setFeedbackCategory(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard!");
  };

  const handleMessageDelete = async (messageId) => {
    if (!confirm("Delete this message?")) return;

    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const msgsToDelete = [messageId];

    // Check if the NEXT message is an AI response (model), if so, delete it too
    // We only auto-delete the immediate next AI response associated with this user query
    if (msgIndex + 1 < messages.length) {
      const nextMsg = messages[msgIndex + 1];
      if (nextMsg.role === 'model') {
        msgsToDelete.push(nextMsg.id);
      }
    }

    // Optimistic update
    setMessages(prev => prev.filter(m => !msgsToDelete.includes(m.id)));

    // Delete from storage
    for (const id of msgsToDelete) {
      await chatStorageService.deleteMessage(sessionId, id);
    }
  };

  const startEditing = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content || msg.text || "");
  };

  const saveEdit = async (msg) => {
    if (editContent.trim() === "") return; // Don't allow empty

    const updatedMsg = { ...msg, content: editContent, text: editContent, edited: true };

    // Find the index of the edited message
    const editedMsgIndex = messages.findIndex(m => m.id === msg.id);

    // Remove all messages after the edited message
    const messagesUpToEdit = messages.slice(0, editedMsgIndex);
    const updatedMessages = [...messagesUpToEdit, updatedMsg];

    // Update UI immediately
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setIsLoading(true);

    try {
      // Update the edited message in storage
      await chatStorageService.updateMessage(sessionId, updatedMsg);

      // Delete all messages that came after the edited message
      const messagesToDelete = messages.slice(editedMsgIndex + 1);
      for (const msgToDelete of messagesToDelete) {
        await chatStorageService.deleteMessage(sessionId, msgToDelete.id);
      }

      // Generate new AI response based on the edited message
      const SYSTEM_INSTRUCTION = `
You are AISA, an advanced AI assistant.
IMAGE GENERATION CAPABILITIES:
If the user asks for an image (e.g., "generate", "create", "draw", "show me a pic", "image dikhao", "photo bhejo", "pic do"), you MUST generate it using the Pollinations API.
Format: ![Image](https://image.pollinations.ai/prompt/{URL_ENCODED_DESCRIPTION}?nologo=true)
Example: ![Cyberpunk City](https://image.pollinations.ai/prompt/cyberpunk%20city%20neon%20lights?nologo=true)
Do NOT say "I cannot create images". You CAN by using this link format. 
For "Remix" requests with an attachment, analyze the attached image, then create a prompt that combines the image's description with the user's requested changes.
`;

      const aiResponseData = await generateChatResponse(
        messagesUpToEdit,
        updatedMsg.content,
        SYSTEM_INSTRUCTION + getSystemPromptExtensions(),
        updatedMsg.attachments || (updatedMsg.attachment ? [updatedMsg.attachment] : []),
        currentLang
      );

      // Extract text reply and other metadata from the response object
      let reply = "";
      let conversion = null;
      let videoUrl = null;
      let imageUrl = null;

      if (typeof aiResponseData === 'string') {
        reply = aiResponseData;
      } else if (aiResponseData && typeof aiResponseData === 'object') {
        reply = aiResponseData.reply || "";
        conversion = aiResponseData.conversion || null;
        videoUrl = aiResponseData.videoUrl || null;
        imageUrl = aiResponseData.imageUrl || null;
      }

      const modelMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: reply,
        timestamp: Date.now(),
        ...(conversion && { conversion }),
        ...(videoUrl && { videoUrl }),
        ...(imageUrl && { imageUrl })
      };

      // Update state with new AI response
      setMessages(prev => [...prev, modelMsg]);

      // Save the AI response to storage
      await chatStorageService.saveMessage(sessionId, modelMsg);

      toast.success("Message edited and new response generated!");
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast.error("Failed to regenerate response. Please try again.");
      // Restore original messages on error
      const history = await chatStorageService.getHistory(sessionId);
      setMessages(history);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameFile = async (msg) => {
    if (!msg.attachment) return;

    const oldName = msg.attachment.name;
    const dotIndex = oldName.lastIndexOf('.');
    const extension = dotIndex !== -1 ? oldName.slice(dotIndex) : '';
    const baseName = dotIndex !== -1 ? oldName.slice(0, dotIndex) : oldName;

    const newBaseName = prompt("Enter new filename:", baseName);
    if (!newBaseName || newBaseName === baseName) return;

    const newName = newBaseName + extension;
    const updatedMsg = {
      ...msg,
      attachment: {
        ...msg.attachment,
        name: newName
      }
    };

    setMessages(prev => prev.map(m => m.id === msg.id ? updatedMsg : m));
    await chatStorageService.updateMessage(sessionId, updatedMsg);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleUndo = async () => {
    if (messages.length <= 1 || isLoading) return;

    // Last message might be AI, second to last is User
    const lastMsg = messages[messages.length - 1];
    const secondLastMsg = messages[messages.length - 2];

    const idsToDelete = [];
    let contentToRestore = "";

    if (lastMsg.role === 'model' && secondLastMsg.role === 'user') {
      idsToDelete.push(lastMsg.id, secondLastMsg.id);
      contentToRestore = secondLastMsg.content || secondLastMsg.text || "";
    } else if (lastMsg.role === 'user') {
      idsToDelete.push(lastMsg.id);
      contentToRestore = lastMsg.content || lastMsg.text || "";
    } else {
      idsToDelete.push(lastMsg.id);
    }

    // Restore content to input field
    if (contentToRestore) {
      setInputValue(contentToRestore);
      // Small delay to ensure state update before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Set cursor at the end
          inputRef.current.selectionStart = contentToRestore.length;
          inputRef.current.selectionEnd = contentToRestore.length;
        }
      }, 50);
    }

    // Optimistic Update
    setMessages(prev => prev.filter(m => !idsToDelete.includes(m.id)));

    // Delete from storage
    try {
      for (const id of idsToDelete) {
        if (id) {
          await chatStorageService.deleteMessage(currentSessionId, id);
        }
      }
      toast.success("Message restored to input", { icon: '↩️' });
    } catch (error) {
      console.error("Undo error:", error);
    }
  };

  const [viewingDoc, setViewingDoc] = useState(null);
  const docContainerRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setViewingDoc(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Process Word documents
  useEffect(() => {
    if (viewingDoc && viewingDoc.name.match(/\.(docx|doc)$/i) && docContainerRef.current) {
      // Clear previous content
      docContainerRef.current.innerHTML = '';

      fetch(viewingDoc.url)
        .then(res => res.blob())
        .then(blob => {
          renderAsync(blob, docContainerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            className: "docx-viewer"
          }).catch(err => {
            console.error("Docx Preview Error:", err);
            docContainerRef.current.innerHTML = '<div class="text-center p-10 text-subtext">Preview not available.<br/>Please download to view.</div>';
          });
        });
    }
  }, [viewingDoc]);

  // Process Excel documents
  useEffect(() => {
    if (viewingDoc && viewingDoc.name.match(/\.(xls|xlsx|csv)$/i)) {
      setExcelHTML(null); // Reset
      fetch(viewingDoc.url)
        .then(res => res.arrayBuffer())
        .then(ab => {
          const wb = XLSX.read(ab, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const ws = wb.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(ws, { id: "excel-preview", editable: false });
          setExcelHTML(html);
        })
        .catch(err => {
          console.error("Excel Preview Error:", err);
          setExcelHTML('<div class="text-center p-10 text-red-500">Failed to load Excel preview.</div>');
        });
    }
  }, [viewingDoc]);

  // Process Text/Code documents
  useEffect(() => {
    // Check if handled by other specific viewers
    const isSpecial = viewingDoc?.name.match(/\.(docx|doc|xls|xlsx|csv|pdf|mp4|webm|ogg|mov|mp3|wav|m4a|jpg|jpeg|png|gif|webp|bmp|svg)$/i) || viewingDoc?.url.startsWith('data:image/');

    if (viewingDoc && !isSpecial) {
      setTextPreview(null);
      fetch(viewingDoc.url)
        .then(res => res.text())
        .then(text => {
          if (text.length > 5000000) {
            setTextPreview(text.substring(0, 5000000) + "\n\n... (File truncated due to size)");
          } else {
            setTextPreview(text);
          }
        })
        .catch(err => {
          console.error("Text Preview Error:", err);
          setTextPreview("Failed to load text content.");
        });
    }
  }, [viewingDoc]);

  return (
    <div className="flex w-full bg-secondary relative overflow-hidden aisa-scalable-text overscroll-none h-[100dvh] fixed inset-0 lg:static lg:h-full">

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-4xl h-full max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-maintext truncate max-w-md">{viewingDoc.name}</h3>
                    <p className="text-xs text-subtext">
                      {viewingDoc.type === 'image' || viewingDoc.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
                        ? 'Image Preview'
                        : 'File Preview'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(viewingDoc.type === 'image' || viewingDoc.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || viewingDoc.url?.startsWith('data:image/')) && (
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(viewingDoc.url);
                          const blob = await response.blob();
                          const pngBlob = blob.type === 'image/png' ? blob : await new Promise((resolve) => {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              canvas.width = img.naturalWidth;
                              canvas.height = img.naturalHeight;
                              canvas.getContext('2d').drawImage(img, 0, 0);
                              canvas.toBlob(resolve, 'image/png');
                            };
                            img.src = viewingDoc.url;
                          });
                          await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
                          toast.success('Image copied!');
                        } catch (err) {
                          toast.error('Could not copy image');
                        }
                      }}
                      className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-subtext"
                      title="Copy Image"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(viewingDoc.url, viewingDoc.name)}
                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-subtext"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewingDoc(null)}
                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-subtext"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative flex items-center justify-center overflow-hidden">
                {viewingDoc.type === 'image' || viewingDoc.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) || viewingDoc.url.startsWith('data:image/') ? (
                  <ImageViewer
                    src={viewingDoc.url}
                    alt="Preview"
                  />
                ) : viewingDoc.name.match(/\.(docx|doc)$/i) ? (
                  <div
                    ref={docContainerRef}
                    className="bg-gray-100 w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center py-8"
                  />
                ) : viewingDoc.name.match(/\.(xls|xlsx|csv)$/i) ? (
                  <div
                    className="bg-white w-full h-full overflow-auto p-4 custom-scrollbar text-black text-sm"
                    dangerouslySetInnerHTML={{ __html: excelHTML || '<div class="flex items-center justify-center h-full"><div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>' }}
                  />
                ) : viewingDoc.name.endsWith('.pdf') || viewingDoc.url.startsWith('data:application/pdf') ? (
                  <iframe
                    src={viewingDoc.url}
                    className="w-full h-full border-0"
                    title="Document Viewer"
                  />
                ) : viewingDoc.name.match(/\.(mp4|webm|ogg|mov)$/i) || viewingDoc.type.startsWith('video/') ? (
                  <video controls className="max-w-full max-h-full rounded-lg shadow-lg" src={viewingDoc.url}>
                    Your browser does not support the video tag.
                  </video>
                ) : viewingDoc.name.match(/\.(mp3|wav|ogg|m4a)$/i) || viewingDoc.type.startsWith('audio/') ? (
                  <div className="p-10 bg-surface rounded-2xl flex flex-col items-center gap-6 shadow-md border border-border">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse-slow">
                      <div className="w-12 h-12 border-2 border-primary rounded-full flex items-center justify-center">
                        <Mic className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-lg mb-1">{viewingDoc.name}</h3>
                      <p className="text-xs text-subtext">Audio File Player</p>
                    </div>
                    <audio controls className="w-full min-w-[300px]" src={viewingDoc.url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : (
                  <div className="w-full h-full bg-[#1e1e1e] p-0 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#cccccc] uppercase tracking-wider">
                          {viewingDoc.name.match(/\.(rar|zip|exe|dll|bin|iso|7z)$/i) ? 'BINARY CONTENT' : 'CODE READER'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0e639c] text-white font-mono shadow-sm">
                        {viewingDoc.name.split('.').pop().toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar p-4">
                      <code className="text-xs font-mono whitespace-pre-wrap text-[#9cdcfe] break-all leading-relaxed tab-4 block">
                        {textPreview || "Reading file stream..."}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <ModelSelector
        isOpen={isModelSelectorOpen}
        onClose={() => setIsModelSelectorOpen(false)}
        toolType={selectedToolType}
        currentModel={selectedToolType ? toolModels[selectedToolType] : 'gemini-flash'}
        onSelectModel={handleModelSelect}
        pricing={TOOL_PRICING}
      />



      {/* Main Area */}
      <div
        className="flex-1 flex flex-col relative bg-gradient-to-br from-secondary via-background to-secondary/50 w-full min-w-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary flex flex-col items-center justify-center pointer-events-none">
            <Cloud className="w-16 h-16 text-primary mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-primary">Drop to Upload</h3>
          </div>
        )}

        {/* Header */}
        <div className="h-12 md:h-14 border-b border-border flex items-center justify-between px-3 md:px-4 bg-secondary z-10 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setTglState(prev => ({ ...prev, sidebarOpen: true }))}
              className="lg:hidden p-2 -ml-2 text-subtext hover:text-maintext rounded-lg hover:bg-surface/50 transition-colors"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300"
            style={{
              backgroundColor: `${getModeColor(isDeepSearch ? 'DEEP_SEARCH' : currentMode)}15`,
              color: getModeColor(isDeepSearch ? 'DEEP_SEARCH' : currentMode)
            }}
          >
            <span>{getModeIcon(isDeepSearch ? 'DEEP_SEARCH' : currentMode)}</span>
            <span className="hidden sm:inline">{getModeName(isDeepSearch ? 'DEEP_SEARCH' : currentMode)}</span>
          </div>
        </div>



        {/* <button className="flex items-center gap-2 text-subtext hover:text-maintext text-sm">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Device</span>
            </button> */}



        {/* Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto p-1 sm:p-2 md:p-3 pb-48 md:pb-56 space-y-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent aisa-scalable-text"
        >
          {messages.length > 0 && (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`group relative flex items-start gap-2 md:gap-3 w-full max-w-5xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  onClick={() => {
                    if (window.getSelection().toString()) return;
                    setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                  }}
                >
                  {/* Actions Menu (Always visible for discoverability) */}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                      ? 'bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-sm'
                      : 'bg-transparent'
                      }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                    ) : (
                      <img src="/logo/AISA.gif?v=3" alt="AISA" className="w-5 h-5 object-contain" />
                    )}
                  </div>

                  <div
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                      } max-w-[85%] sm:max-w-[80%] md:max-w-[75%]`}
                  >
                    <div
                      className={`group/bubble relative transition-all duration-300 min-h-[40px] w-fit max-w-full ${msg.role === 'user'
                        ? 'px-3 py-2.5 sm:px-5 sm:py-4 rounded-2xl sm:rounded-[1.5rem] bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/30 text-slate-900 dark:text-white rounded-tr-sm shadow-xl shadow-black/5 text-sm sm:text-base hover:scale-[1.002] leading-relaxed whitespace-pre-wrap break-words'
                        : `text-maintext text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words`
                        }`}
                    >

                      {msg.isProcessing && (
                        <div className="flex items-center gap-3 mb-3 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-pulse">
                          <Loader size="sm" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-tighter">Preparing Audio...</span>
                        </div>
                      )}

                      {/* Attachment Display */}
                      {((msg.attachments && msg.attachments.length > 0) || msg.attachment) && (
                        <div className="flex flex-col gap-3 mb-3 mt-1">
                          {(msg.attachments || (msg.attachment ? [msg.attachment] : [])).map((att, idx) => (
                            <div key={idx} className="w-full">
                              {att.type === 'image' ? (
                                <div
                                  className="relative group/image overflow-hidden rounded-xl border border-white/20 shadow-lg transition-all hover:scale-[1.01] cursor-pointer max-w-[320px]"
                                  onClick={() => setViewingDoc(att)}
                                >
                                  <img
                                    src={att.url}
                                    alt="Attachment"
                                    className="w-full h-auto max-h-[400px] object-contain bg-black/5"
                                    loading="lazy"
                                    onError={(e) => {
                                      console.error("Attachment image load failed:", att.url);
                                      if (att.url && !e.target.dataset.retried) {
                                        e.target.dataset.retried = "true";
                                        setTimeout(() => {
                                          e.target.src = att.url + (att.url.includes('?') ? '&' : '?') + 'retry=' + Date.now();
                                        }, 2000);
                                      } else {
                                        const errorText = att.url ? (att.url.substring(0, 30) + '...') : 'Unknown URL';
                                        e.target.src = `https://placehold.co/600x400/333/eee?text=Attachment+Unavailable%0A${encodeURIComponent(errorText)}%0AClick+to+Retry`;
                                        e.target.style.cursor = 'pointer';
                                        e.target.onclick = (event) => {
                                          event.stopPropagation();
                                          e.target.src = att.url + (att.url.includes('?') ? '&' : '?') + 'manual=' + Date.now();
                                        };
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(att.url, att.name);
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-all hover:bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors backdrop-blur-md ${msg.role === 'user' ? 'bg-transparent border-white/20 hover:bg-white/10 shadow-none' : 'bg-secondary/30 border-border hover:bg-secondary/50'}`}>
                                  <div
                                    className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer p-0.5 rounded-lg"
                                    onClick={() => setViewingDoc(att)}
                                  >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${(() => {
                                      const name = (att.name || '').toLowerCase();
                                      if (msg.role === 'user') return 'bg-white shadow-sm';
                                      if (name.endsWith('.pdf')) return 'bg-red-50 dark:bg-red-900/20';
                                      if (name.match(/\.(doc|docx)$/)) return 'bg-blue-50 dark:bg-blue-900/20';
                                      if (name.match(/\.(xls|xlsx|csv)$/)) return 'bg-emerald-50 dark:bg-emerald-900/20';
                                      if (name.match(/\.(ppt|pptx)$/)) return 'bg-orange-50 dark:bg-orange-900/20';
                                      return 'bg-secondary';
                                    })()}`}>
                                      {(() => {
                                        const name = (att.name || '').toLowerCase();
                                        const baseClass = "w-6 h-6";
                                        if (name.match(/\.(xls|xlsx|csv)$/)) return <FileSpreadsheet className={`${baseClass} text-emerald-600`} />;
                                        if (name.match(/\.(ppt|pptx)$/)) return <Presentation className={`${baseClass} text-orange-600`} />;
                                        if (name.endsWith('.pdf')) return <FileText className={`${baseClass} text-red-600`} />;
                                        if (name.match(/\.(doc|docx)$/)) return <FileIcon className={`${baseClass} text-blue-600`} />;
                                        return <FileIcon className={`${baseClass} text-primary`} />;
                                      })()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold truncate text-xs mb-0.5">{att.name || 'File'}</p>
                                      <p className="text-[10px] opacity-70 uppercase tracking-tight font-medium">
                                        {(() => {
                                          const name = (att.name || '').toLowerCase();
                                          if (name.endsWith('.pdf')) return 'PDF • Preview';
                                          if (name.match(/\.(doc|docx)$/)) return 'WORD • Preview';
                                          if (name.match(/\.(xls|xlsx|csv)$/)) return 'EXCEL';
                                          if (name.match(/\.(ppt|pptx)$/)) return 'SLIDES';
                                          return 'DOCUMENT';
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(att.url, att.name);
                                    }}
                                    className={`p-2 rounded-lg transition-colors shrink-0 ${msg.role === 'user' ? 'hover:bg-white/20 text-white' : 'hover:bg-primary/10 text-primary'}`}
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}






                      {editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-3 min-w-[200px] w-full">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-white/10 text-white rounded-xl p-3 text-sm focus:outline-none resize-none border border-white/20 placeholder-white/50"
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEdit(msg);
                              }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="flex gap-3 justify-end items-center">
                            <button
                              onClick={cancelEdit}
                              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msg)}
                              className="bg-white text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors shadow-sm"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.content && (
                          <div id={`msg-text-${msg.id}`} className={`max-w-full break-words leading-relaxed whitespace-normal ${msg.role === 'user' ? 'text-slate-900 dark:text-white' : 'text-maintext'}`}>
                            {msg.role === 'user' && msg.mode === MODES.DEEP_SEARCH && (
                              <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-white/20 rounded-lg w-fit">
                                <Search size={10} className="text-white" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Deep Search</span>
                              </div>
                            )}
                            {msg.role === 'model' && msg.isRealTime && (
                              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit animate-pulse-slow">
                                <span className="text-lg">🌐</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Real-Time Data</span>
                              </div>
                            )}

                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href, children }) => {
                                  const isInternal = href && href.startsWith('/');
                                  return (
                                    <a
                                      href={href}
                                      onClick={(e) => {
                                        if (isInternal) {
                                          e.preventDefault();
                                          navigate(href);
                                        }
                                      }}
                                      className="text-primary hover:underline font-bold cursor-pointer"
                                      target={isInternal ? "_self" : "_blank"}
                                      rel={isInternal ? "" : "noopener noreferrer"}
                                    >
                                      {children}
                                    </a>
                                  );
                                },
                                p: ({ children }) => <p className={`mb-2 last:mb-0 ${msg.role === 'user' ? 'm-0 leading-normal' : 'leading-[1.75] tracking-[0.015em] [word-spacing:0.05em]'}`}>{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-2 marker:text-subtext/70 transition-all">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-2 marker:text-subtext/70 transition-all">{children}</ol>,
                                li: ({ children }) => <li className="mb-1.5 last:mb-0 transition-colors leading-[1.75] tracking-[0.015em] [word-spacing:0.05em]">{children}</li>,
                                h1: ({ children }) => <h1 className="font-bold mb-2 mt-3 block text-[1.4em] text-maintext tracking-tight">{children}</h1>,
                                h2: ({ children }) => <h2 className="font-bold mb-1.5 mt-2 block text-[1.2em] text-maintext tracking-tight">{children}</h2>,
                                h3: ({ children }) => <h3 className="font-bold mb-1 mt-1.5 block text-[1.1em] text-maintext tracking-tight">{children}</h3>,
                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                mark: ({ children }) => <mark className="bg-[#5555ff] text-white px-1 py-0.5 rounded-sm">{children}</mark>,
                                code: ({ node, inline, className, children, ...props }) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const lang = match ? match[1] : '';

                                  if (!inline && match) {
                                    return (
                                      <div className="rounded-xl overflow-hidden my-2 border border-border bg-[#1e1e1e] shadow-md w-full max-w-full">
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
                                          <span className="text-xs font-mono text-gray-300 lowercase">{lang}</span>
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                              toast.success("Code copied!");
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy code
                                          </button>
                                        </div>
                                        <div className="p-4 overflow-x-auto custom-scrollbar bg-[#1e1e1e]">
                                          <code className={`${className} font-mono text-[0.9em] leading-relaxed text-[#d4d4d4] block min-w-full`} {...props}>
                                            {children}
                                          </code>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-primary font-bold mx-0.5" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                img: ({ node, ...props }) => {
                                  // Check if this image is actually a video thumbnail or if we have a video URL in the message
                                  // For now, we assume this renderer handles static images from markdown.
                                  // Actual Dynamic Video/Image rendering is handled by the msg properties check below.
                                  return (
                                    <div
                                      className="relative group/generated mt-4 mb-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all hover:scale-[1.01] bg-surface/50 backdrop-blur-sm cursor-zoom-in max-w-md"
                                      onClick={() => setViewingDoc({ url: props.src, type: 'image', name: 'Generated Image' })}
                                    >
                                      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center opacity-100 sm:opacity-0 sm:group-hover/generated:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">AISA Generated Asset</span>
                                        </div>
                                      </div>
                                      <img
                                        {...props}
                                        className="w-full max-w-sm h-auto max-h-[400px] object-contain rounded-xl bg-black/5"
                                        loading="lazy"
                                        onLoad={() => scrollToBottom(true)}
                                        onError={(e) => {
                                          e.target.src = 'https://placehold.co/600x400?text=Image+Generating...';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/generated:opacity-100 transition-opacity pointer-events-none" />
                                      <button
                                        disabled={isDownloadingUrl === props.src}
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent opening modal when clicking download
                                          handleDownload(props.src, 'aisa-generated.png');
                                        }}
                                        className={`absolute bottom-3 right-3 p-2.5 rounded-xl opacity-100 sm:opacity-0 sm:group-hover/generated:opacity-100 transition-all shadow-lg border border-white/20 scale-100 sm:scale-90 sm:group-hover/generated:scale-100 ${isDownloadingUrl === props.src ? 'bg-zinc-600 cursor-wait' : 'bg-primary hover:bg-primary/90 text-white'}`}
                                        title="Download High-Res"
                                      >
                                        <div className="flex items-center gap-2 px-1">
                                          {isDownloadingUrl === props.src ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                          ) : (
                                            <Download className="w-4 h-4" />
                                          )}
                                          <span className="text-[10px] font-bold uppercase">
                                            {isDownloadingUrl === props.src ? 'Downloading...' : 'Download'}
                                          </span>
                                        </div>
                                      </button>
                                    </div>
                                  )
                                },
                              }}
                            >
                              {msg.content || msg.text || ""}
                            </ReactMarkdown>

                            {/* Real-Time Sources List */}
                            {msg.role === 'model' && msg.isRealTime && msg.sources && msg.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-[10px] font-bold uppercase text-subtext mb-3 flex items-center gap-2">
                                  <ExternalLink className="w-3 h-3" />
                                  Trusted Sources
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.sources.map((source, sIdx) => (
                                    <a
                                      key={sIdx}
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-primary/10 border border-border rounded-lg transition-all group/source"
                                    >
                                      <span className="text-xs font-medium text-maintext group-hover/source:text-primary truncate max-w-[150px]">
                                        {source.title}
                                      </span>
                                      <div className="w-4 h-4 bg-primary/20 rounded flex items-center justify-center">
                                        <ExternalLink className="w-2.5 h-2.5 text-primary" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dynamic Video Rendering */}
                            {msg.videoUrl && (
                              <div className="relative mt-4 mb-2">
                                <CustomVideoPlayer src={msg.videoUrl} />
                              </div>
                            )}

                            {/* Dynamic Image Rendering (if not in markdown) */}
                            {msg.imageUrl && (
                              <div
                                className="relative group/generated mt-4 mb-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl transition-all hover:scale-[1.01] bg-surface/50 backdrop-blur-sm cursor-zoom-in max-w-sm"
                                onClick={() => {
                                  if (!viewingDoc) setViewingDoc({ url: msg.imageUrl, type: 'image', name: 'Generated Image' });
                                }}
                              >
                                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent z-10 flex justify-between items-center opacity-100 sm:opacity-0 sm:group-hover/generated:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">AISA Generated Asset</span>
                                  </div>
                                </div>
                                <img
                                  src={msg.imageUrl}
                                  alt="Generated Content"
                                  className="w-full h-auto max-h-[420px] object-contain transition-all duration-500 group-hover/image:scale-[1.02]"
                                  loading="eager"
                                  onLoad={() => {
                                    console.log("Image loaded successfully:", msg.imageUrl);
                                    scrollToBottom(true);
                                  }}
                                  onError={(e) => {
                                    console.error("Image load failed for URL:", msg.imageUrl);
                                    if (!e.target.dataset.retried) {
                                      e.target.dataset.retried = "true";
                                      setTimeout(() => {
                                        const retryUrl = msg.imageUrl + (msg.imageUrl.includes('?') ? '&' : '?') + 'retry=' + Date.now();
                                        console.log("Retrying image load:", retryUrl);
                                        e.target.src = retryUrl;
                                      }, 2000);
                                    } else {
                                      const finalErrorMsg = msg.imageUrl?.includes('cloudinary') ? 'Cloudinary Error' :
                                        msg.imageUrl?.includes('pollinations') ? 'AI Model Error' : 'Display Issue';
                                      e.target.src = `https://placehold.co/600x400/222/fff?text=${encodeURIComponent(finalErrorMsg)}%0AClick+to+Retry`;
                                      e.target.style.cursor = 'pointer';
                                      e.target.onclick = (event) => {
                                        event.stopPropagation();
                                        e.target.src = msg.imageUrl + (msg.imageUrl.includes('?') ? '&' : '?') + 'manual=' + Date.now();
                                      };
                                    }
                                  }}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover/generated:opacity-100 transition-all scale-100 sm:scale-90 sm:group-hover/generated:scale-100">
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const response = await fetch(msg.imageUrl);
                                        const blob = await response.blob();
                                        const pngBlob = blob.type === 'image/png' ? blob : await new Promise((resolve) => {
                                          const img = new Image();
                                          img.crossOrigin = 'anonymous';
                                          img.onload = () => {
                                            const canvas = document.createElement('canvas');
                                            canvas.width = img.naturalWidth;
                                            canvas.height = img.naturalHeight;
                                            canvas.getContext('2d').drawImage(img, 0, 0);
                                            canvas.toBlob(resolve, 'image/png');
                                          };
                                          img.src = msg.imageUrl;
                                        });
                                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
                                        toast.success('Image copied!');
                                      } catch (err) {
                                        toast.error('Could not copy image');
                                      }
                                    }}
                                    className="p-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 shadow-lg border border-white/20"
                                    title="Copy Image"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    disabled={isDownloadingUrl === msg.imageUrl}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(msg.imageUrl, 'aisa-generated.png');
                                    }}
                                    className={`p-2.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-2 ${isDownloadingUrl === msg.imageUrl ? 'bg-zinc-600 cursor-wait' : 'bg-primary text-white hover:bg-primary/90'}`}
                                    title="Download High-Res"
                                  >
                                    <div className="flex items-center gap-2 px-1">
                                      {isDownloadingUrl === msg.imageUrl ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                      <span className="text-[10px] font-bold uppercase">
                                        {isDownloadingUrl === msg.imageUrl ? 'Downloading...' : 'Download'}
                                      </span>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {/* File Conversion Download Button */}
                      {msg.conversion && msg.conversion.file && (
                        <div className="mt-4 pt-3 border-t border-border/40 space-y-3">
                          {/* Integrated Audio Player for Voice Conversations */}
                          {msg.conversion.mimeType.startsWith('audio/') && (
                            <div className="bg-primary/5 rounded-xl p-2 border border-primary/10 mb-2">
                              <audio
                                controls
                                className="w-full h-10 accent-primary rounded-lg"
                                src={msg.conversion.blobUrl || `data:${msg.conversion.mimeType};base64,${msg.conversion.file}`}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}

                          <div className="flex items-center justify-between px-1 py-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-maintext truncate">{msg.conversion.fileName}</p>
                              <p className="text-[10px] text-subtext font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                                  {msg.conversion.fileSize || "Ready"}
                                </span>
                                {msg.conversion.charCount && (
                                  <span className="px-1.5 py-0.5 bg-secondary/30 text-subtext rounded-md border border-border/50">
                                    {msg.conversion.charCount} CHARS
                                  </span>
                                )}
                                {msg.conversion.mimeType.includes('audio') ? 'AUDIO • MP3' : msg.conversion.mimeType.includes('pdf') ? 'PDF • DOCUMENT' : 'WORD • DOCUMENT'}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => {
                                const downloadToast = toast.loading("Starting download...");
                                try {
                                  // Create download link
                                  const byteCharacters = atob(msg.conversion.file);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: msg.conversion.mimeType });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = msg.conversion.fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  setTimeout(() => {
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast.dismiss(downloadToast);
                                    toast.success("Download complete!");
                                  }, 500);
                                } catch (err) {
                                  toast.dismiss(downloadToast);
                                  toast.error("Download failed");
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl transition-all hover:bg-primary/90 shadow-sm font-bold text-sm active:scale-95"
                            >
                              <Download className="w-4 h-4" />
                              Download {msg.conversion.mimeType.includes('audio') ? 'Audio' : msg.conversion.mimeType.includes('pdf') ? 'PDF' : 'Document'}
                            </button>

                            <Menu as="div" className="relative">
                              <Menu.Button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border text-maintext rounded-xl transition-all hover:bg-hover font-bold text-sm shadow-sm active:scale-95 whitespace-nowrap">
                                <Share className="w-4 h-4" />
                                Share
                              </Menu.Button>

                              <Portal>
                                <Transition
                                  as={Fragment}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items
                                    anchor="bottom end"
                                    className="w-56 mt-2 origin-top-right divide-y divide-border rounded-xl bg-surface shadow-2xl border border-border focus:outline-none z-[100] overflow-hidden"
                                  >
                                    <div className="px-1 py-1">
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => {
                                              const text = `I've converted "${msg.conversion.fileName}" into voice audio using AISA! ${window.location.href}`;
                                              const url = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                                                ? `whatsapp://send?text=${encodeURIComponent(text)}`
                                                : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                                              window.open(url, '_blank', 'noopener');
                                            }}
                                            className={`${active ? 'bg-green-500 text-white' : 'text-maintext'} group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors`}
                                          >
                                            <MessageCircle className="h-4 w-4" />
                                            WhatsApp
                                          </button>
                                        )}
                                      </Menu.Item>
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => {
                                              const text = `AISA Audio Conversion: ${msg.conversion.fileName}`;
                                              const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
                                              window.open(url, '_blank');
                                            }}
                                            className={`${active ? 'bg-sky-500 text-white' : 'text-maintext'} group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors`}
                                          >
                                            <Send className="h-4 w-4" />
                                            Telegram
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                    <div className="px-1 py-1">
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => {
                                              navigator.clipboard.writeText(window.location.href);
                                              toast.success("Link copied!");
                                            }}
                                            className={`${active ? 'bg-primary text-white' : 'text-maintext'} group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors`}
                                          >
                                            <Copy className="h-4 w-4" />
                                            Copy Link
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Portal>
                            </Menu>
                          </div>
                        </div>
                      )}

                      {/* AI Feedback Actions - Strictly hide for media and processing */}
                      {(msg.role === 'model' || msg.role === 'assistant') &&
                        !msg.conversion && !msg.imageUrl && !msg.videoUrl &&
                        !msg.isProcessing && !msg.isGenerating && (
                          <div className="mt-4 w-full block">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                              {(() => {
                                // Detect if the AI response contains Hindi (Devanagari script)
                                const isHindiContent = /[\u0900-\u097F]/.test(msg.content);
                                const prompts = isHindiContent ? FEEDBACK_PROMPTS.hi : FEEDBACK_PROMPTS.en;
                                const promptIndex = (msg.id.toString().charCodeAt(msg.id.toString().length - 1) || 0) % prompts.length;
                                return (
                                  <p className="text-xs text-subtext font-medium flex items-center gap-1.5 shrink-0 m-0">
                                    {prompts[promptIndex]}
                                    <span className="text-sm">😊</span>
                                  </p>
                                );
                              })()}
                              <div className="flex flex-col items-end gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      // Pass message ID to speakResponse for tracking
                                      const isHindi = /[\u0900-\u097F]/.test(msg.content);
                                      speakResponse(msg.content, isHindi ? 'Hindi' : 'English', msg.id, msg.attachments || [], true);
                                    }}
                                    className={`transition-colors p-1.5 rounded-lg ${speakingMessageId === msg.id
                                      ? 'text-primary bg-primary/10'
                                      : 'text-subtext hover:text-primary hover:bg-surface-hover'
                                      }`}
                                    title={speakingMessageId === msg.id && !isPaused ? "Pause" : "Speak"}
                                  >
                                    {speakingMessageId === msg.id && !isPaused ? (
                                      <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                      <Volume2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleCopyMessage(msg.content)}
                                    className="text-subtext hover:text-maintext transition-colors p-1.5 hover:bg-surface-hover rounded-lg"
                                    title="Copy"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleThumbsUp(msg.id)}
                                    className={`transition-colors p-1.5 rounded-lg ${messageFeedback[msg.id]?.type === 'up'
                                      ? 'text-blue-500 bg-blue-500/10'
                                      : 'text-subtext hover:text-primary hover:bg-surface-hover'
                                      }`}
                                    title="Helpful"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleThumbsDown(msg.id)}
                                    className={`transition-colors p-1.5 rounded-lg ${messageFeedback[msg.id]?.type === 'down'
                                      ? 'text-red-500 bg-red-500/10'
                                      : 'text-subtext hover:text-red-500 hover:bg-surface-hover'
                                      }`}
                                    title="Not Helpful"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleShare(msg.content)}
                                    className="text-subtext hover:text-primary transition-colors p-1.5 hover:bg-surface-hover rounded-lg"
                                    title="Share Text"
                                  >
                                    <Share className="w-3.5 h-3.5" />
                                  </button>

                                  {/* PDF Tools */}
                                  <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 ml-2 pl-2">
                                    {/* Copy PDF - NEW */}
                                    <button
                                      onClick={() => handlePdfAction('copy', msg)}
                                      onMouseEnter={() => handlePdfAction('pregenerate', msg)}
                                      onFocus={() => handlePdfAction('pregenerate', msg)}
                                      className="text-subtext hover:text-primary transition-all p-1.5 hover:bg-surface-hover rounded-lg flex items-center gap-1 active:scale-95"
                                      title="Copy PDF File"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>

                                    {/* PDF Share — Direct 1-click */}
                                    <button
                                      onClick={() => handlePdfAction('share', msg)}
                                      onMouseEnter={() => handlePdfAction('pregenerate', msg)}
                                      onFocus={() => handlePdfAction('pregenerate', msg)}
                                      className="text-red-500 hover:text-red-600 transition-all p-1.5 hover:bg-red-50/10 rounded-lg flex items-center gap-1 active:scale-95"
                                      title={pregeneratedPdfs[msg.id] ? "Share PDF ✓ Ready" : "Share PDF"}
                                    >
                                      <FileText className="w-4 h-4" />
                                      {pdfLoadingId === msg.id && !pregeneratedPdfs[msg.id] ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                      ) : pregeneratedPdfs[msg.id] ? (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                      ) : null}
                                    </button>
                                  </div>
                                </div>


                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                    <span className="text-[10px] text-subtext mt-0 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Hover Actions - User Only (AI has footer) */}
                  {
                    msg.role === 'user' && (
                      <div className={`flex items-center gap-1 transition-opacity duration-200 self-start mt-2 mr-0 flex-row-reverse ${activeMessageId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

                        <button
                          onClick={() => handleCopyMessage(msg.content || msg.text)}
                          className="p-1.5 text-subtext hover:text-primary hover:bg-surface rounded-full transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {!msg.attachment && (
                          <button
                            onClick={() => startEditing(msg)}
                            className="p-1.5 text-blue-500 hover:text-primary hover:bg-surface rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {msg.attachment && (
                          <button
                            onClick={() => handleRenameFile(msg)}
                            className="p-1.5 text-blue-500 hover:text-primary hover:bg-surface rounded-full transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* Only show Undo for the most recent user message if it's the last or second to last message in the whole chat */}
                        {msg.id === messages.findLast(m => m.role === 'user')?.id && (
                          <button
                            onClick={handleUndo}
                            className="p-1.5 text-subtext hover:text-primary hover:bg-surface rounded-full transition-colors"
                            title="Undo"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleMessageDelete(msg.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  }
                </div>
              ))}

              {isLoading && !typingMessageId && (
                <div className="flex items-start gap-4 max-w-4xl mx-auto">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <img src="/logo/AISA.gif?v=3" alt="AISA" className="w-5 h-5 object-contain" />

                  </div>
                  <div className="p-1 flex items-center gap-3">
                    <span className="text-sm font-medium text-subtext animate-pulse">
                      {loadingText}
                    </span>
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-subtext/50 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-subtext/50 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-subtext/50 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Welcome Screen - Absolute Overlay */}
        {
          messages.length === 0 && (
            <div className="absolute inset-0 z-0 flex flex-col items-center overflow-y-auto overflow-x-hidden no-scrollbar pointer-events-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(12rem, env(safe-area-inset-bottom) + 12rem)' }}>
              <div className="flex flex-col items-center w-full max-w-4xl px-4 py-2 text-center">
                <div className="select-none flex items-center justify-center w-full" style={{ minHeight: '4rem', marginTop: '2rem', marginBottom: '1rem' }}>
                  <img
                    src="/logo/AISA.gif?v=3"
                    alt="AISA Icon"
                    className="object-contain drop-shadow-2xl pointer-events-none shrink-0"
                    style={{ width: '4rem', height: '4rem', minWidth: '3rem', minHeight: '3rem', maxWidth: '6rem', maxHeight: '6rem' }}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
                <h2 className="font-bold text-maintext tracking-tight w-full px-4" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                  {t('welcomeMessage')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md px-4 animate-in hover:none pb-4" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  {[
                    {
                      icon: <ImageIcon className="w-5 h-5 text-purple-500" />,
                      title: "Generate Image",
                      desc: "Create visuals from text",
                      action: () => {
                        if (inputRef.current) {
                          inputRef.current.value = "Generate an image of ";
                          inputRef.current.focus();
                        }
                      }
                    },
                    {
                      icon: <Search className="w-5 h-5 text-blue-500" />,
                      title: "Deep Search",
                      desc: "Research complex topics",
                      action: () => {
                        setIsDeepSearch(true);
                        if (inputRef.current) inputRef.current.focus();
                        toast.success("Deep Search Mode Enabled");
                      }
                    },
                    {
                      icon: <FileText className="w-5 h-5 text-orange-500" />,
                      title: "Analyze Document",
                      desc: "Chat with PDFs & Docs",
                      action: () => uploadInputRef.current?.click()
                    },
                    {
                      icon: <Globe className="w-5 h-5 text-blue-500" />,
                      title: "Real-Time Search",
                      desc: "Get live data from the web",
                      action: () => {
                        setIsWebSearch(true);
                        if (inputRef.current) inputRef.current.focus();
                        toast.success("Real-Time Web Search Enabled");
                      }
                    },
                    {
                      icon: <Code className="w-5 h-5 text-indigo-500" />,
                      title: "Code Writer",
                      desc: "Write & debug code",
                      action: () => {
                        setIsCodeWriter(true);
                        if (inputRef.current) inputRef.current.focus();
                        toast.success("Code Writer Mode Enabled");
                      }
                    }
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="flex items-center gap-3 p-3 sm:p-4 bg-surface/50 hover:bg-surface border border-border/50 hover:border-primary/30 rounded-2xl text-left transition-all duration-200 group active:scale-95 shadow-sm hover:shadow-md backdrop-blur-sm w-full"
                    >
                      <div className="p-2.5 bg-background rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-maintext text-sm">{item.title}</h3>
                        <p className="text-xs text-subtext font-medium">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-transparent z-20" style={{ padding: 'max(0.375rem, env(safe-area-inset-bottom, 0.375rem)) max(0.5rem, env(safe-area-inset-right, 0.5rem)) max(0.375rem, 0.375rem) max(0.5rem, env(safe-area-inset-left, 0.5rem))' }}>
          <div className="max-w-5xl mx-auto relative px-1 sm:px-2">

            {/* File Preview Area */}
            {filePreviews.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-4 px-2 overflow-x-auto custom-scrollbar no-scrollbar flex gap-3 pb-2 z-20 pointer-events-auto">
                {filePreviews.map((preview) => (
                  <div
                    key={preview.id}
                    className="relative shrink-0 w-64 md:w-72 bg-surface/95 dark:bg-zinc-900/95 border border-border/50 rounded-2xl p-2.5 flex items-center gap-3 shadow-xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-300 ring-1 ring-black/5"
                  >
                    <div className="relative group shrink-0">
                      {preview.type.startsWith('image/') ? (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-border/50 bg-black/5">
                          <img src={preview.url} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
                          <FileText className="w-7 h-7 text-primary" />
                        </div>
                      )}

                      <div className="absolute -top-2 -right-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(preview.id)}
                          className="p-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-surface"
                          title="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 py-1">
                      <p className="text-sm font-semibold text-maintext truncate pr-1">{preview.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-lg uppercase tracking-wider font-bold">
                          {preview.type.split('/')[1]?.split('-')[0] || 'FILE'}
                        </span>
                        <span className="text-[10px] text-subtext font-medium">
                          {(preview.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative w-full max-w-5xl mx-auto flex items-center gap-[6px] bg-white dark:bg-[#0a0a0a] border border-black/5 dark:border-white/10 rounded-[16px] p-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:border-primary/20 backdrop-blur-3xl px-[10px] z-50">
              <input
                id="file-upload"
                type="file"
                ref={uploadInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <input
                id="drive-upload"
                type="file"
                ref={driveInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <input
                id="doc-voice-upload"
                type="file"
                onChange={handleDocToVoiceSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <input
                id="photos-upload"
                type="file"
                ref={photosInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
                accept="image/*"
              />
              <input
                id="camera-upload"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                capture="environment"
              />

              {/* Left Actions Group */}
              <div className="flex items-center gap-[2px] pl-[2px] shrink-0">
                <AnimatePresence>
                  {isAttachMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      ref={menuRef}
                      className="absolute bottom-full left-0 mb-4 w-[min(85vw,220px)] bg-surface/95 dark:bg-[#1a1a1a]/95 border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-30 backdrop-blur-xl ring-1 ring-black/5"
                    >
                      <div className="p-2 space-y-1">
                        {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canCamera && (
                          <label
                            htmlFor="camera-upload"
                            onClick={() => setTimeout(() => setIsAttachMenuOpen(false), 500)}
                            className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-primary/10 rounded-xl transition-all group cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/20 transition-colors shrink-0">
                              <Camera className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-[13px] font-semibold text-maintext group-hover:text-primary transition-colors">Camera & Scan</span>
                          </label>
                        )}
                        <label
                          htmlFor="file-upload"
                          onClick={() => setIsAttachMenuOpen(false)}
                          className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-primary/10 rounded-xl transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/20 transition-colors shrink-0">
                            <Paperclip className="w-4 h-4 text-subtext group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-[13px] font-semibold text-maintext group-hover:text-primary transition-colors">Upload files</span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isToolsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      ref={toolsMenuRef}
                      className="absolute bottom-full left-0 mb-[12px] w-[min(94vw,320px)] sm:w-[350px] bg-surface/95 dark:bg-[#1a1a1a]/95 border border-border/50 rounded-3xl shadow-2xl overflow-hidden z-30 backdrop-blur-xl ring-1 ring-black/5"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                    >
                      <div className="px-4 py-3 bg-secondary/30 border-b border-border/50 shrink-0">
                        <h3 className="text-[11px] font-bold text-subtext uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" /> AISA Magic Tools
                        </h3>
                      </div>
                      <div className="p-1.5 pb-4 space-y-1 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsImageGeneration(!isImageGeneration);
                            setIsVideoGeneration(false);
                            setIsDeepSearch(false);
                            setIsAudioConvertMode(false);
                            setIsDocumentConvert(false);
                            setIsCodeWriter(false);
                            if (!isImageGeneration) toast.success("Image Generation Mode Enabled");
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isImageGeneration ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isImageGeneration ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <ImageIcon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Generate Image</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Create beautiful visuals from text</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsVideoGeneration(!isVideoGeneration);
                            setIsImageGeneration(false);
                            setIsDeepSearch(false);
                            setIsAudioConvertMode(false);
                            setIsDocumentConvert(false);
                            setIsCodeWriter(false);
                            if (!isVideoGeneration) toast.success("Video Generation Mode Enabled");
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isVideoGeneration ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isVideoGeneration ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <Video className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Generate Video</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Create AI videos from text</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsWebSearch(!isWebSearch);
                            setIsDeepSearch(false);
                            setIsImageGeneration(false);
                            setIsVideoGeneration(false);
                            setIsAudioConvertMode(false);
                            setIsDocumentConvert(false);
                            setIsCodeWriter(false);
                            if (!isWebSearch) toast.success("Real-Time Web Search Active");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isWebSearch ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isWebSearch ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <Globe className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Web Search</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Live information from the web</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsDeepSearch(!isDeepSearch);
                            setIsWebSearch(false);
                            setIsImageGeneration(false);
                            setIsVideoGeneration(false);
                            setIsAudioConvertMode(false);
                            setIsDocumentConvert(false);
                            setIsCodeWriter(false);
                            if (!isDeepSearch) toast.success("Deep Search Mode Enabled");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isDeepSearch ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isDeepSearch ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <Search className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Deep Search</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Advanced web research & analysis</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsAudioConvertMode(!isAudioConvertMode);
                            setIsDeepSearch(false);
                            setIsImageGeneration(false);
                            setIsVideoGeneration(false);
                            setIsDocumentConvert(false);
                            setIsCodeWriter(false);
                            if (!isAudioConvertMode) toast.success("Convert to Audio Mode Active");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isAudioConvertMode ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isAudioConvertMode ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <Headphones className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Convert to Audio</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Turn documents into speech</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsDocumentConvert(!isDocumentConvert);
                            setIsDeepSearch(false);
                            setIsImageGeneration(false);
                            setIsVideoGeneration(false);
                            setIsAudioConvertMode(false);
                            setIsCodeWriter(false);
                            if (!isDocumentConvert) toast.success("Document Converter Mode Active");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isDocumentConvert ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isDocumentConvert ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Convert Documents</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">PDF ↔ Word conversion</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsToolsMenuOpen(false);
                            setIsCodeWriter(!isCodeWriter);
                            setIsDeepSearch(false);
                            setIsImageGeneration(false);
                            setIsVideoGeneration(false);
                            setIsAudioConvertMode(false);
                            setIsDocumentConvert(false);
                            setIsEditingImage(false);
                            setIsMagicEditing(false);
                            if (!isCodeWriter) toast.success("Code Writer Mode Enabled");
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded-2xl transition-all group cursor-pointer ${isCodeWriter ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
                        >
                          <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${isCodeWriter ? 'bg-primary border-primary text-white' : 'bg-surface border-border group-hover:border-primary/30 group-hover:bg-primary/10'}`}>
                            <Code className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold text-maintext block leading-tight">Code Writer</span>
                            <span className="text-[10px] text-subtext block leading-tight truncate mt-0.5">Write & debug code with AISA</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-subtext hover:text-primary hover:bg-secondary transition-all active:scale-95 shadow-sm hover:shadow-md"
                  title="Attachments"
                >
                  <Plus className={`w-[20px] h-[20px] transition-transform duration-300 ${isAttachMenuOpen ? 'rotate-45' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-subtext hover:text-primary hover:bg-secondary transition-all active:scale-95 shadow-sm hover:shadow-md"
                  title="AISA Magic Tools"
                >
                  <Sparkles className="w-[20px] h-[20px]" />
                </button>
              </div>

              <div className="flex-1 flex items-center min-w-0 bg-transparent border-0 ring-0 focus:ring-0">
                <AnimatePresence>
                  {(isWebSearch || isDeepSearch || isImageGeneration || isVideoGeneration || isVoiceMode || isAudioConvertMode || isDocumentConvert || isCodeWriter || isMagicEditing) && (
                    <div className="absolute bottom-full left-0 mb-3 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto w-full">
                      {isWebSearch && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold border border-blue-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Globe size={12} strokeWidth={3} /> <span className="hidden sm:inline">Web Search</span>
                          <button onClick={() => setIsWebSearch(false)} className="ml-1 hover:text-blue-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isDeepSearch && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Search size={12} strokeWidth={3} /> <span className="hidden sm:inline">Deep Search</span>
                          <button onClick={() => setIsDeepSearch(false)} className="ml-1 hover:text-primary/80"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isImageGeneration && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-pink-500/10 text-pink-600 rounded-full text-xs font-bold border border-pink-500/20 backdrop-blur-md shrink-0">
                          <ImageIcon size={12} strokeWidth={3} />
                          <div className="relative flex items-center">
                            <select
                              className="bg-transparent outline-none appearance-none cursor-pointer font-bold pr-4 pl-1 text-[11px] max-w-[150px] sm:max-w-[200px] truncate"
                              value={imageAspectRatio}
                              onChange={(e) => setImageAspectRatio(e.target.value)}
                            >
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="1:1">1:1 – For Instagram Square Post</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="16:9">16:9 – For YouTube Thumbnail & Landscape</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="4:5">4:5 – For Social Media Post</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="4:7">4:7 – For Vertical Social Media</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-0 pointer-events-none" />
                          </div>
                          <button onClick={() => setIsImageGeneration(false)} className="ml-1 hover:text-pink-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isVideoGeneration && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold border border-red-500/20 backdrop-blur-md shrink-0">
                          <Video size={12} strokeWidth={3} />
                          <div className="relative flex items-center">
                            <select
                              className="bg-transparent outline-none appearance-none cursor-pointer font-bold pr-4 pl-1 text-[11px] max-w-[150px] sm:max-w-[200px] truncate"
                              value={videoAspectRatio}
                              onChange={(e) => setVideoAspectRatio(e.target.value)}
                            >
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="">Default (16:9)</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="16:9">16:9 – For YouTube Thumbnail</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="9:16">9:16 – For Vertical Social Media</option>
                              <option className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white font-medium" value="1:1">1:1 – For Instagram Square Post</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-0 pointer-events-none" />
                          </div>
                          <button onClick={() => setIsVideoGeneration(false)} className="ml-1 hover:text-red-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isVoiceMode && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold border border-blue-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Volume2 size={12} strokeWidth={3} /> <span className="hidden sm:inline">Voice Mode</span>
                          <button onClick={() => setIsVoiceMode(false)} className="ml-1 hover:text-blue-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isAudioConvertMode && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-xs font-bold border border-indigo-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Headphones size={12} strokeWidth={3} /> <span className="hidden sm:inline">Audio Convert</span>
                          <button onClick={() => setIsAudioConvertMode(false)} className="ml-1 hover:text-indigo-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isDocumentConvert && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <FileText size={12} strokeWidth={3} /> <span className="hidden sm:inline">Doc Convert</span>
                          <button onClick={() => setIsDocumentConvert(false)} className="ml-1 hover:text-emerald-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isCodeWriter && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-purple-500/10 text-purple-600 rounded-full text-xs font-bold border border-purple-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Code size={12} strokeWidth={3} /> <span className="hidden sm:inline">Code Writer</span>
                          <button onClick={() => setIsCodeWriter(false)} className="ml-1 hover:text-purple-800"><X size={12} /></button>
                        </motion.div>
                      )}
                      {isMagicEditing && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold border border-amber-500/20 backdrop-blur-md whitespace-nowrap shrink-0">
                          <Wand2 size={12} strokeWidth={3} /> <span className="hidden sm:inline">Image Edit</span>
                          <button onClick={() => setIsMagicEditing(false)} className="ml-1 hover:text-amber-800"><X size={12} /></button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>



                <textarea
                  ref={inputRef}
                  value={inputValue}
                  disabled={isLoading || isLimitReached}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputValue.trim() || selectedFiles.length > 0) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                  placeholder={isLimitReached ? "Chat limit reached. Sign in to continue." : (isVideoGeneration ? "Describe the video you want to generate..." : isAudioConvertMode ? "Enter text to convert..." : isDocumentConvert ? "Upload file & ask to convert..." : "Ask AISA")}
                  rows={1}
                  className={`w-full bg-transparent border-0 focus:ring-0 outline-none focus:outline-none p-0 py-2 text-maintext text-left placeholder-subtext/40 resize-none overflow-y-auto custom-scrollbar leading-relaxed text-[15px] ${isLimitReached ? 'cursor-not-allowed opacity-50' : ''}`}
                  style={{ minHeight: '24px', height: 'auto', maxHeight: '150px', lineHeight: '1.5' }}
                />
              </div>

              {/* Right Actions Group */}
              <div className="flex items-center gap-[4px] sm:gap-[6px] pr-[2px] shrink-0">
                {isListening && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20 mr-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-600 uppercase">REC</span>
                  </div>
                )}

                {!isListening && (
                  <>
                    {getAgentCapabilities(activeAgent.agentName, activeAgent.category).canVoice && (
                      <button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`w-[36px] h-[36px] rounded-full flex items-center justify-center transition-colors shrink-0 ${isListening ? 'bg-red-500 text-white' : 'text-subtext hover:text-primary hover:bg-secondary'}`}
                        title="Voice Input"
                      >
                        <Mic className="w-[20px] h-[20px] shrink-0" />
                      </button>
                    )}
                  </>
                )}

                {isLoading ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (abortControllerRef.current) abortControllerRef.current.abort();
                      setIsLoading(false);
                      isSendingRef.current = false;
                    }}
                    className="w-[36px] h-[36px] rounded-full bg-[#5555ff] text-white flex items-center justify-center shadow-lg hover:bg-[#4444ee] hover:scale-105 transition-all"
                  >
                    <div className="w-[12px] h-[12px] bg-white rounded-sm" />
                  </button>
                ) : (
                  <div className="flex items-center gap-[6px]">

                    <button
                      type="submit"
                      disabled={(!inputValue.trim() && filePreviews.length === 0) || isLoading}
                      className={`w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all shadow-lg ${(!inputValue.trim() && filePreviews.length === 0) ? 'bg-secondary text-subtext/50 shadow-none' : 'bg-gradient-to-tr from-primary to-indigo-600 text-white shadow-primary/30 hover:scale-105 hover:shadow-primary/40'}`}
                    >
                      <Send className="w-[20px] h-[20px] ml-[2px]" />
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Live AI Modal */}
        <AnimatePresence>
          {isLiveMode && (
            <LiveAI
              onClose={() => setIsLiveMode(false)}
              language={currentLang}
            />
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        <Transition appear show={feedbackOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setFeedbackOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface p-6 text-left align-middle shadow-xl transition-all border border-border">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-maintext flex justify-between items-center"
                    >
                      Share feedback
                      <button onClick={() => setFeedbackOpen(false)} className="text-subtext hover:text-maintext">
                        <X className="w-5 h-5" />
                      </button>
                    </Dialog.Title>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Incorrect or incomplete", "Not what I asked for", "Slow or buggy", "Style or tone", "Safety or legal concern", "Other"].map(cat => (
                        <button
                          key={cat}
                          onClick={() => toggleFeedbackCategory(cat)}
                          className={`text-xs px-3 py-2 rounded-full border transition-colors ${feedbackCategory.includes(cat)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-transparent text-subtext border-border hover:border-maintext'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4">
                      <textarea
                        className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-3 text-sm focus:outline-none border border-transparent focus:border-border text-maintext placeholder-subtext resize-none"
                        rows={3}
                        placeholder="Share details (optional)"
                        value={feedbackDetails}
                        onChange={(e) => setFeedbackDetails(e.target.value)}
                      />
                    </div>

                    <div className="mt-4 text-[10px] text-subtext leading-tight">
                      Your conversation will be included with your feedback to help improve the AI.
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        disabled={isSubmittingFeedback}
                        className={`inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all ${isSubmittingFeedback ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        onClick={submitFeedback}
                      >
                        {isSubmittingFeedback && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Limit Reached Modal */}
        <Transition show={isLimitReached} as={Fragment}>
          <Dialog as="div" className="relative z-[200]" onClose={() => { }}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-border p-8 text-center shadow-2xl transition-all">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                    </div>

                    <Dialog.Title as="h3" className="text-2xl font-black text-maintext mb-2 tracking-tight uppercase">
                      Chat Limit Reached
                    </Dialog.Title>

                    <p className="text-subtext mb-8 leading-relaxed text-sm">
                      You've reached the guest limit of 10 sessions and 5 messages per session.
                      Sign in to unlock **unlimited chat**, image generation, and more!
                    </p>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => navigate('/login', { state: { from: location.pathname } })}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95 uppercase"
                      >
                        Sign In Now
                      </button>
                      <button
                        onClick={() => navigate('/signup')}
                        className="w-full py-4 bg-black/5 dark:bg-white/5 border border-border text-maintext rounded-2xl font-bold text-sm tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 uppercase"
                      >
                        Create Free Account
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div >
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          // Re-init chat to show correct greeting
          setTimeout(() => window.location.reload(), 500);
        }}
      />

      {/* ===== WHATSAPP IN-APP SHARE MODAL ===== */}
      {
        waShareModal && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-sm">WhatsApp pe Share Karo</h3>
                  <p className="text-white/70 text-xs">PDF link bhejein — bina app chhode</p>
                </div>
                <button onClick={() => setWaShareModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Phone Input */}
                <div>
                  <label className="text-xs font-semibold text-subtext mb-1.5 block">📱 Phone Number (Country Code ke saath)</label>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-surface-hover rounded-xl px-3 border border-border/50 text-sm text-maintext font-mono">+</div>
                    <input
                      type="tel"
                      value={waPhone}
                      onChange={e => setWaPhone(e.target.value)}
                      placeholder="91 9876543210"
                      className="flex-1 bg-surface-hover border border-border/50 rounded-xl px-3 py-2.5 text-sm text-maintext placeholder-subtext focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-subtext mt-1">Example: 91 9876543210 (India), 1 2025551234 (USA)</p>
                </div>

                {/* Message Preview */}
                <div>
                  <label className="text-xs font-semibold text-subtext mb-1.5 block">💬 Message Preview</label>
                  <textarea
                    value={waMsgContent}
                    onChange={e => setWaMsgContent(e.target.value)}
                    rows={3}
                    className="w-full bg-surface-hover border border-border/50 rounded-xl px-3 py-2.5 text-xs text-maintext focus:outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366] transition-all resize-none"
                  />
                </div>

                {/* PDF Link */}
                {waPdfUrl && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    <span className="text-xs text-green-600 font-medium truncate">PDF Ready: {waPdfUrl.split('/').pop()}</span>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 px-5 pb-5">
                <button
                  onClick={() => setWaShareModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm text-subtext hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendWhatsAppMessage}
                  disabled={waUploading || !waPhone}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  WhatsApp pe Bhejo
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Chat;
