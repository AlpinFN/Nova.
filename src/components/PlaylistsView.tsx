import React, { useEffect, useState } from 'react';
import { getPlaylists, createPlaylist, updatePlaylist, deletePlaylist, getVideosMeta, getMyChannelId } from '../db';
import { Playlist, VideoMeta } from '../types';
import { Plus, Trash2, ListVideo, X } from 'lucide-react';
import { formatTimeAgo } from '../utils';

interface PlaylistsViewProps {
  onVideoClick: (video: VideoMeta) => void;
}

export function PlaylistsView({ onVideoClick }: PlaylistsViewProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [myId, setMyId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<VideoMeta[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getPlaylists();
    const mid = await getMyChannelId();
    const v = await getVideosMeta();
    setPlaylists(p.sort((a,b) => b.timestamp - a.timestamp));
    setMyId(mid);
    setVideos(v);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createPlaylist(myId, newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this playlist?")) {
      await deletePlaylist(id);
      if (activePlaylist?.id === id) setActivePlaylist(null);
      await loadData();
    }
  };

  if (activePlaylist) {
    const listVideos = activePlaylist.videoIds.map(id => videos.find(v => v.id === id)).filter(v => v) as VideoMeta[];
    
    return (
      <div className="w-full max-w-5xl mx-auto px-6 py-12 pb-32">
        <div className="flex items-center gap-6 mb-12 border-b border-zinc-900 pb-8">
          <button onClick={() => setActivePlaylist(null)} className="p-4 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-white">{activePlaylist.title}</h1>
            <p className="text-zinc-400 mt-2 font-medium">{activePlaylist.description}</p>
          </div>
          {activePlaylist.channelId === myId && (
            <button 
              onClick={() => handleDelete(activePlaylist.id)}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-red-500/20 transition-colors border border-red-500/20 hover:border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete Playlist
            </button>
          )}
        </div>

        {listVideos.length === 0 ? (
          <div className="text-center p-12 text-zinc-500 font-bold uppercase tracking-widest">
            Playlist is empty. Add transmissions to it.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listVideos.map((v, idx) => (
              <div 
                key={v.id}
                onClick={() => onVideoClick(v)}
                className="flex items-center gap-6 p-4 rounded-[1.5rem] bg-zinc-900/20 hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer group"
              >
                <div className="text-zinc-600 font-display text-2xl font-bold w-8 text-center">{idx + 1}</div>
                <div className="w-48 aspect-video bg-zinc-900 rounded-[1rem] overflow-hidden shrink-0 relative">
                  <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white group-hover:text-lime-400 transition-colors">{v.title}</h3>
                  <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mt-2">{v.views || 0} Views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 pb-32">
      <div className="flex items-end justify-between border-b border-zinc-900 pb-8 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-white">Playlists</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Curated Transmissions</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-lime-400 text-lime-950 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map(p => (
          <div 
            key={p.id}
            onClick={() => setActivePlaylist(p)}
            className="flex flex-col bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/80 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-zinc-800 rounded-[1rem] flex items-center justify-center mb-6 text-zinc-400 group-hover:text-lime-400 group-hover:bg-lime-400/10 transition-colors border border-zinc-700 group-hover:border-lime-400/30">
              <ListVideo className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">{p.title}</h3>
            {p.description && <p className="text-sm font-medium text-zinc-400 mb-6 flex-1 line-clamp-3">{p.description}</p>}
            <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{p.videoIds.length} Transmissions</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{formatTimeAgo(p.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <form onSubmit={handleCreate} className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative">
            <button type="button" onClick={() => setShowCreate(false)} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-display text-2xl font-bold uppercase tracking-widest mb-8">New Playlist</h2>
            
            <div className="space-y-6">
               <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3" htmlFor="title">Title</label>
                <input required id="title" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-[1rem] px-6 py-4 text-white focus:outline-none focus:border-lime-400 transition-colors font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3" htmlFor="desc">Description</label>
                <textarea id="desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-[1rem] px-6 py-4 text-white focus:outline-none focus:border-lime-400 transition-colors h-32 resize-none" />
              </div>
              <button type="submit" disabled={!newTitle.trim()} className="w-full py-4 bg-lime-400 text-lime-950 font-bold uppercase tracking-widest rounded-full disabled:opacity-50 hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                 Initialize Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
