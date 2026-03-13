import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { UploadCloud, File, CheckCircle, X, Loader, Trash2, ExternalLink } from 'lucide-react';
import { apiService } from '../services/apiService';
import { API } from '../types';

const KnowledgeUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [category, setCategory] = useState('General');
    const [isDragActive, setIsDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');
    const [documents, setDocuments] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setIsLoadingDocs(true);
        try {
            const data = await apiService.getKnowledgeDocuments();
            if (data.success) {
                setDocuments(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoadingDocs(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleDeleteClick = (doc) => {
        setDocumentToDelete(doc);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;
        setIsDeleting(true);
        try {
            await apiService.deleteKnowledgeDocument(documentToDelete._id);
            fetchDocuments();
            setDocumentToDelete(null);
        } catch (error) {
            console.error("Failed to delete document", error);
            alert("Failed to delete document.");
        } finally {
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDocumentToDelete(null);
    };

    const handleOpen = (doc) => {
        if (!doc || !doc._id) return;
        const publicUrl = `${API}/aibase/knowledge/download/${doc._id}`;
        window.open(publicUrl, '_blank');
    };

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            setUploadStatus(null);
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus(null);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        try {
            const data = await apiService.uploadKnowledgeDocument(formData, (percent) => {
                setUploadProgress(percent);
            });

            if (data.success) {
                setUploadStatus('success');
                fetchDocuments();
                if (onUploadSuccess) onUploadSuccess(data.data);
            }
        } catch (error) {
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.message || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setUploadStatus(null);
        setUploadProgress(0);
        setErrorMessage('');
    };

    return (
        <div className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl p-5 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-left">
                    <h2 className="text-xl font-bold text-maintext">
                        Vertex AI Knowledge Base
                    </h2>
                    <p className="text-subtext text-sm mt-2">
                        Upload documents to your AISA knowledge base for advanced retrieval-augmented generation (RAG).
                    </p>
                </div>

                <div className="w-full md:w-1/2">
                    <AnimatePresence mode="wait">
                        {!file && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ease-out cursor-pointer group hover:bg-slate-800/50 ${isDragActive ? 'border-purple-500 bg-slate-800/80' : 'border-slate-600 bg-slate-800/30'
                                    }`}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                    accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,image/*"
                                />

                                <motion.div
                                    animate={{ y: isDragActive ? -10 : 0, scale: isDragActive ? 1.1 : 1 }}
                                    className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all"
                                >
                                    <UploadCloud className="w-8 h-8 text-purple-400" />
                                </motion.div>

                                <p className="text-slate-200 font-medium text-lg">
                                    {isDragActive ? "Drop document here" : "Drag & drop document"}
                                </p>
                                <p className="text-slate-500 text-sm mt-2 font-medium">
                                    or click to browse from device
                                </p>
                            </motion.div>
                        )}

                        {file && !uploadStatus && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                            <File className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                            <p className="text-slate-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>

                                    {!isUploading && (
                                        <button
                                            onClick={resetUpload}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {isUploading && (
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                                            <span>Uploading to Google Cloud Storage...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isUploading && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Category (Domain)</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 outline-none focus:border-purple-500 transition-colors"
                                        >
                                            <option value="General">General</option>
                                            <option value="HR">HR / Policies</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Sales">Sales & Marketing</option>
                                            <option value="Support">Customer Support</option>
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${isUploading
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25'
                                        }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Upload to Knowledge Base</span>
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {uploadStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                    className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4"
                                >
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-emerald-400 mb-2">Upload Successful!</h3>
                                <p className="text-slate-300 mb-6">
                                    Your document has been stored in <strong>aisa_knowledge_base</strong> and is ready for Vertex AI RAG.
                                </p>
                                <button
                                    onClick={resetUpload}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium border border-slate-700"
                                >
                                    Upload Another Document
                                </button>
                            </motion.div>
                        )}

                        {uploadStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                    <X className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-red-400 mb-2">Upload Failed</h3>
                                <p className="text-red-300 text-sm mb-6">{errorMessage}</p>
                                <button
                                    onClick={resetUpload}
                                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium border border-slate-700"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Document List Section */}
            <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-lg font-bold text-maintext mb-4">Uploaded Documents</h3>
                {isLoadingDocs ? (
                    <div className="flex justify-center py-8 text-subtext">
                        <Loader className="w-6 h-6 animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-subtext text-center py-4">No documents found in knowledge base.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                            <div key={doc._id} className="bg-white/10 dark:bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <File className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-maintext truncate" title={doc.filename}>{doc.filename}</p>
                                        <div className="flex items-center gap-2 text-xs text-subtext mt-1">
                                            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-medium">{doc.category || 'General'}</span>
                                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                            {doc.size && <span>• {(doc.size / 1024 / 1024).toFixed(2)} MB</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    {doc.gcsUri && (
                                        <button
                                            onClick={() => handleOpen(doc)}
                                            className="p-2 text-subtext hover:text-blue-400 transition-colors"
                                            title="Open Document"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteClick(doc)}
                                        className="p-2 text-subtext hover:text-red-400 transition-colors"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {documentToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full"
                        >
                            <div className="flex items-center gap-4 text-red-400 mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Delete Document</h3>
                            </div>
                            <p className="text-slate-300 mb-6 font-medium">
                                Are you sure you want to delete <span className="text-white">"{documentToDelete.filename}"</span>?<br /><br />
                                <span className="text-slate-400 text-sm font-normal">This action will permanently remove it from the Storage bucket and Vertex AI RAG Corpus. This cannot be undone.</span>
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2 rounded-xl text-slate-300 hover:bg-white/5 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-medium transition-colors flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Document'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KnowledgeUpload;
