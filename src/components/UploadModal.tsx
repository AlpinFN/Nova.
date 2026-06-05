import { FileVideo, UploadCloud, X, Loader2, Sparkles } from "lucide-react";
import React, { useState, useRef } from "react";
import { generateThumbnail, formatBytes } from "../utils";
import { saveVideo } from "../db";
import { VideoMeta } from "../types";

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: (meta: VideoMeta) => void;
}

export function UploadModal({ onClose, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      // Auto-fill title from filename
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type.startsWith('video/')) {
        setFile(selected);
        const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      } else {
        alert("Please drop a video file.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const generateAISuggestion = async () => {
    if (!file) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/suggest-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
      });
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.hashtags && Array.isArray(data.hashtags)) {
        setHashtags(data.hashtags.join(", "));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get AI suggestions.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;

    setIsProcessing(true);
    try {
      // 1. Generate thumbnail & duration
      const { thumbnail, duration, width, height } = await generateThumbnail(file);
      
      const isShort = height > width;
      
      if (isShort && duration > 180) {
        alert(`Short (Vertical) videos cannot exceed 3 minutes. Your video is ${Math.round(duration)} seconds long.`);
        setIsProcessing(false);
        return;
      }

      // Fetch my channel ID
      const { getMyChannelId } = await import('../db');
      const channelId = await getMyChannelId();

      const parsedHashtags = hashtags.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      // 2. Create metadata
      const meta: VideoMeta = {
        id: crypto.randomUUID(),
        channelId,
        title: title.trim(),
        description: description.trim(),
        thumbnail,
        timestamp: Date.now(),
        size: file.size,
        duration,
        views: 0,
        likes: [],
        isShort,
        hashtags: parsedHashtags
      };

      // 3. Save to IDB
      await saveVideo(meta, file);

      onUploadComplete(meta);
      onClose();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to process video.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-zinc-100">Upload Signal</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {!file ? (
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-zinc-800 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center hover:border-lime-400/50 hover:bg-lime-400/5 transition-all cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6 group-hover:bg-lime-400/10 group-hover:text-lime-400 transition-colors shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-lime-400 transition-colors" />
              </div>
              <p className="font-display text-xl font-bold uppercase tracking-widest text-zinc-100 mb-4 group-hover:text-lime-400 transition-colors">Transmit New Data</p>
              <p className="font-sans text-xs font-bold tracking-widest uppercase text-zinc-500 mb-8 leading-relaxed max-w-xs mx-auto">
                Select or drag a video file. Unrestricted limits. Local persistence.
              </p>
              <button className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-8 py-4 rounded-full hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all">
                Select File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*" 
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-start gap-6 p-6 bg-zinc-900/50 rounded-[1.5rem] border border-zinc-800">
                <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center shrink-0 text-lime-400 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                  <FileVideo className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-display font-bold text-zinc-100 text-lg truncate mb-1 uppercase tracking-wider">{file.name}</p>
                  <p className="font-sans text-xs font-bold tracking-widest uppercase text-zinc-500">{formatBytes(file.size)}</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="font-display text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors mt-2 bg-zinc-800 px-4 py-2 rounded-full"
                >
                  Change
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex justify-end">
                  <button
                    onClick={generateAISuggestion}
                    disabled={isGeneratingAI}
                    className="font-display text-xs font-bold uppercase tracking-widest text-lime-400 hover:text-lime-300 transition-colors bg-lime-400/10 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-lime-400/20 disabled:opacity-50"
                  >
                    {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGeneratingAI ? 'Generating...' : 'AI Suggestion'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] px-6 py-4 text-xl font-display font-bold text-zinc-100 focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-700 uppercase"
                    placeholder="Enter Title..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-6 text-sm font-medium text-zinc-300 focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-700 resize-none"
                    placeholder="Document transmission details..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-3">Hashtags</label>
                  <input 
                    type="text" 
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] px-6 py-4 text-sm font-medium text-zinc-300 focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-700"
                    placeholder="#gaming, #vlog (comma separated)"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {file && (
          <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-zinc-900/50">
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="font-display font-bold uppercase tracking-widest text-sm text-zinc-400 hover:text-zinc-100 px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={!title.trim() || isProcessing}
              className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-8 py-3 rounded-full hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? 'Processing' : 'Transmit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
