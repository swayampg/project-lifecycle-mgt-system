import React, { useEffect } from 'react';
import { X, Download, Maximize2, FileText, Image as ImageIcon, Video, Music, ExternalLink } from 'lucide-react';
import './FileViewer.css';

const FileViewer = ({ url, filename, onClose }) => {
    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    if (!url) return null;

    const getFileType = (url) => {
        if (!url) return 'unknown';
        const extension = url.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
        const pdfExtensions = ['pdf'];
        const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

        if (imageExtensions.includes(extension)) return 'image';
        if (videoExtensions.includes(extension)) return 'video';
        if (audioExtensions.includes(extension)) return 'audio';
        if (pdfExtensions.includes(extension)) return 'pdf';
        if (officeExtensions.includes(extension)) return 'office';
        
        return 'unknown';
    };

    const fileType = getFileType(url);
    const viewerUrl = (fileType === 'pdf' || fileType === 'office') 
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` 
        : url;

    const handleDownload = () => {
        window.open(url, '_blank');
    };

    const renderContent = () => {
        switch (fileType) {
            case 'image':
                return <img src={url} alt={filename || "Preview"} className="viewer-image" />;
            case 'video':
                return (
                    <video controls autoPlay className="viewer-video">
                        <source src={url} />
                        Your browser does not support the video tag.
                    </video>
                );
            case 'audio':
                return (
                    <div className="unsupported-file">
                        <Music size={64} className="unsupported-icon" />
                        <audio controls autoPlay>
                            <source src={url} />
                        </audio>
                        <p className="mt-3 text-white">{filename || "Audio File"}</p>
                    </div>
                );
            case 'pdf':
            case 'office':
                return (
                    <iframe 
                        src={viewerUrl} 
                        title="Document Viewer" 
                        className="viewer-iframe"
                    />
                );
            default:
                return (
                    <div className="unsupported-file">
                        <FileText size={64} className="unsupported-icon" />
                        <h3 className="text-white">Preview not available</h3>
                        <p>This file type cannot be previewed in the browser.</p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="download-link">
                            <Download size={18} /> Download and View
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="file-viewer-overlay" onClick={onClose}>
            <div className="file-viewer-container" onClick={(e) => e.stopPropagation()}>
                <div className="file-viewer-header">
                    <div className="file-info">
                        {fileType === 'image' && <ImageIcon size={18} />}
                        {fileType === 'video' && <Video size={18} />}
                        {(fileType === 'pdf' || fileType === 'office') && <FileText size={18} />}
                        {fileType === 'unknown' && <ExternalLink size={18} />}
                        <span className="file-name">{filename || "File Preview"}</span>
                    </div>
                    <div className="file-viewer-actions">
                        <button className="viewer-action-btn" onClick={handleDownload} title="Open in new tab">
                            <Maximize2 size={18} />
                        </button>
                        <button className="viewer-action-btn viewer-close-btn" onClick={onClose} title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="file-viewer-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default FileViewer;
