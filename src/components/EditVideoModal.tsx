import React, { useState } from 'react';
import { VideoMeta } from '../types';
import { updateVideoMeta } from '../db';
import { X, Loader2 } from 'lucide-react';

interface EditVideoModalProps {
  video: VideoMeta;
  onClose: () => void;
  onSave: (meta: VideoMeta) => void;
}

export function EditVideoModal({ video, onClose, onSave }: EditVideoModalProps) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [hashtags, setHashtags] = useState(video.hashtags ? video.hashtags.join(", ") : "");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsProcessing(true);
    try {
      const parsedHashtags = hashtags.split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

      const updatedStr = { ...video, title: title.trim(), description: description.trim(), hashtags: parsedHashtags };
      await updateVideoMeta(updatedStr);
      onSave(updatedStr);
      onClose();
    } catch(err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-zinc-100">Edit Signal</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto space-y-8">
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

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-zinc-900/50">
          <button onClick={onClose} disabled={isProcessing} className="font-display font-bold uppercase tracking-widest text-sm text-zinc-400 hover:text-zinc-100 px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim() || isProcessing} className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-8 py-3 rounded-full hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all disabled:opacity-50 flex items-center gap-3">
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? 'Saving' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
