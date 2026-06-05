import React, { useState } from 'react';
import { Camera, Sparkles, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { addPost, getMyChannelId } from '../db';
import { Post } from '../types';

interface CreatePostProps {
  onPostCreated: () => void;
  onCancel: () => void;
}

export function CreatePostModal({ onPostCreated, onCancel }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImageAI = async () => {
    if (!imagePrompt.trim()) {
      alert("Please enter a prompt for the AI image generator.");
      return;
    }
    setIsGeneratingImg(true);
    try {
      const res = await fetch('/api/generate-post-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await res.json();
      if (data.image) {
        setUploadedImage(data.image);
      } else {
        alert("Failed to generate image.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const generateTextAI = async () => {
    if (!imagePrompt.trim()) {
      alert("Enter a topic in the AI image prompt box to generate text about it.");
      return;
    }
    setIsGeneratingText(true);
    try {
      const res = await fetch('/api/generate-post-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: imagePrompt })
      });
      const data = await res.json();
      if (data.text) {
        setContent(data.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !uploadedImage) return;
    setIsPublishing(true);
    
    const myId = await getMyChannelId();
    const newPost: Post = {
      id: crypto.randomUUID(),
      channelId: myId,
      content,
      imageUrl: uploadedImage || undefined,
      timestamp: Date.now(),
      likes: []
    };
    
    await addPost(newPost);
    setIsPublishing(false);
    onPostCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-screen">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
          <h2 className="font-display font-bold uppercase tracking-widest text-xl">Create Transmission</h2>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold">Close</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          <div>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What do you want to broadcast?"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-lime-400 text-white placeholder-zinc-600 resize-none h-32"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={generateTextAI}
                disabled={isGeneratingText}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-lime-400 bg-lime-400/10 px-4 py-2 rounded-full hover:bg-lime-400/20 disabled:opacity-50"
              >
                {isGeneratingText ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                AI Text
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-[1.5rem] p-4 flex flex-col gap-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Attach Visual Data</h3>
            
            {uploadedImage ? (
              <div className="relative aspect-video rounded-xl overflow-hidden group">
                <img src={uploadedImage} className="w-full h-full object-cover" />
                <button onClick={() => setUploadedImage('')} className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 border-dashed rounded-xl h-24 cursor-pointer text-zinc-400 hover:text-white transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Upload Local Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                
                <div className="flex items-center gap-4">
                   <div className="h-px bg-zinc-800 flex-1"/>
                   <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">OR USE AI</span>
                   <div className="h-px bg-zinc-800 flex-1"/>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    placeholder="Describe an image to generate..."
                    className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:border-lime-400 focus:outline-none placeholder-zinc-600"
                  />
                  <button 
                    onClick={generateImageAI}
                    disabled={isGeneratingImg}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingImg ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-900 flex justify-end gap-4 bg-zinc-950">
          <button 
             onClick={onCancel}
             className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
             onClick={handlePublish}
             disabled={isPublishing || (!content.trim() && !uploadedImage)}
             className="flex items-center gap-2 bg-lime-400 text-lime-950 font-bold px-8 py-3 rounded-full hover:bg-lime-500 disabled:opacity-50 uppercase tracking-widest text-xs transition-colors shadow-[0_0_15px_rgba(163,230,53,0.2)]"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Transmit
          </button>
        </div>
      </div>
    </div>
  );
}
