import React, { useRef, useState } from 'react';
import { Channel } from '../types';
import { saveChannel } from '../db';
import { X, Upload, Camera } from 'lucide-react';

interface ChannelEditProps {
  channel: Channel;
  onClose: () => void;
  onSave: () => void;
}

export function ChannelEdit({ channel, onClose, onSave }: ChannelEditProps) {
  const [displayName, setDisplayName] = useState(channel.displayName);
  const [handle, setHandle] = useState(channel.handle);
  const [bio, setBio] = useState(channel.bio);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(channel.avatar);
  const [bannerPreview, setBannerPreview] = useState<string | null>(channel.banner);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          if (type === 'avatar') setAvatarPreview(event.target.result);
          if (type === 'banner') setBannerPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    await saveChannel({
      ...channel,
      displayName: displayName.trim(),
      handle: handle.trim().startsWith('@') ? handle.trim() : '@' + handle.trim(),
      bio: bio.trim(),
      avatar: avatarPreview,
      banner: bannerPreview
    });
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col rounded-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
          <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-zinc-100">Edit Channel</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Banner Upload */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 pl-2">Banner Image</label>
            <div 
              className="w-full h-32 bg-zinc-900 rounded-[1.5rem] border border-zinc-800 hover:border-lime-400/50 cursor-pointer overflow-hidden relative group transition-colors flex items-center justify-center"
              onClick={() => bannerRef.current?.click()}
            >
              {bannerPreview ? (
                <>
                  <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-lime-400" />
                    <span className="text-xs font-bold tracking-widest uppercase text-lime-400">Change Banner</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-lime-400 transition-colors">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-bold tracking-widest uppercase">Upload Banner</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" ref={bannerRef} className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 pl-2">Profile Picture</label>
            <div className="flex items-center gap-6">
              <div 
                className="w-24 h-24 bg-zinc-900 rounded-full border border-zinc-800 hover:border-lime-400/50 cursor-pointer overflow-hidden relative group transition-colors shrink-0 flex items-center justify-center"
                onClick={() => avatarRef.current?.click()}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                    <Camera className="w-6 h-6 text-lime-400 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <Camera className="w-8 h-8 text-zinc-500 group-hover:text-lime-400 transition-colors" />
                )}
              </div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                <p>Upload a square image.</p>
                <p>Max file size: 2MB.</p>
              </div>
            </div>
            <input type="file" accept="image/*" ref={avatarRef} className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
          </div>
          
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 pl-2">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] px-6 py-4 text-xl font-display font-bold text-zinc-100 focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 pl-2">Handle</label>
            <input 
              type="text" 
              value={handle}
              onChange={e => setHandle(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] px-6 py-4 text-xl font-display font-medium text-zinc-300 focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold tracking-widest uppercase text-zinc-500 mb-2 pl-2">Bio</label>
            <textarea 
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-6 text-base font-medium text-zinc-300 focus:outline-none focus:border-lime-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="font-display font-bold uppercase tracking-widest text-sm text-zinc-400 hover:text-zinc-100 px-6 py-3 rounded-full hover:bg-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-8 py-3 rounded-full hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
