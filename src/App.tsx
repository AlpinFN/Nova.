import { Compass, Sparkles, Flame, Shield, Youtube, Plus, Search, Layers, User, Radio, Smartphone, Hash, MessageCircle, MessageSquare, History, ListVideo, Bell, Settings, ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { UploadModal } from "./components/UploadModal";
import { VideoPlayer } from "./components/VideoPlayer";
import { ChannelView } from "./components/ChannelView";
import { ChannelEdit } from "./components/ChannelEdit";
import { LiveStream } from "./components/LiveStream";
import { ShortsFeed } from "./components/ShortsFeed";
import { AIAssistant } from "./components/AIAssistant";
import { BotEngine } from "./components/BotEngine";
import { PostsFeed } from "./components/PostsFeed";
import { CreatePostModal } from "./components/CreatePostModal";
import { ChatsView } from "./components/ChatsView";
import { HistoryView } from "./components/HistoryView";
import { PlaylistsView } from "./components/PlaylistsView";
import { Impressum } from "./components/Impressum";
import { getVideosMeta, getMyChannelId, getChannel, checkMigration } from "./db";
import { VideoMeta, Channel } from "./types";
import { formatDuration, formatTimeAgo } from "./utils";

import { useLanguage } from "./LanguageContext";

type ViewState = 
  | { type: 'home' }
  | { type: 'video'; video: VideoMeta }
  | { type: 'channel'; channelId: string }
  | { type: 'live'; channelId: string }
  | { type: 'shorts' }
  | { type: 'ai' }
  | { type: 'posts' }
  | { type: 'chats'; initialUserId?: string }
  | { type: 'history' }
  | { type: 'playlists' }
  | { type: 'impressum' };

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewHistory, setViewHistory] = useState<ViewState[]>([]);
  const [view, setViewState] = useState<ViewState>(() => {
    if (window.location.pathname === '/impressum' || window.location.hash === '#impressum') {
      return { type: 'impressum' };
    }
    return { type: 'home' };
  });

  const setView = (newView: ViewState) => {
    setViewHistory(prev => [...prev, view]);
    setViewState(newView);
  };

  const goBack = () => {
    if (viewHistory.length > 0) {
      const prev = viewHistory[viewHistory.length - 1];
      setViewHistory(history => history.slice(0, -1));
      setViewState(prev);
    } else {
      setViewState({ type: 'home' });
    }
  };
  const [myChannel, setMyChannel] = useState<Channel | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'trending'>('explore');

  useEffect(() => {
    checkMigration().then(() => {
      loadVideos();
      loadMyChannel();
    });
  }, [view]);

  const loadVideos = async () => {
    const metaList = await getVideosMeta();
    setVideos(metaList);
  };

  const loadMyChannel = async () => {
    const id = await getMyChannelId();
    const ch = await getChannel(id);
    if (ch) setMyChannel(ch);
  };

  const filteredVideos = videos.filter(v => 
    (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.hashtags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Simple algorithm for trending
  const displayVideos = activeTab === 'trending' 
    ? [...filteredVideos].sort((a,b) => b.views - a.views)
    : [...filteredVideos].sort((a,b) => b.timestamp - a.timestamp); // explore by date

  if (view.type === 'video') {
    return (
      <VideoPlayer 
        video={view.video} 
        onBack={goBack}
        onDeleted={(id) => {
          goBack();
          // No need to setVideos here, loadVideos will be triggered by useEffect
        }}
        onChannelClick={(channelId) => setView({ type: 'channel', channelId })}
        onVideoClick={(video) => setView({ type: 'video', video })}
      />
    );
  }

  if (view.type === 'live') {
    return (
      <LiveStream 
        channelId={view.channelId}
        onBack={goBack}
        onChannelClick={(channelId) => setView({ type: 'channel', channelId })}
      />
    );
  }

  if (view.type === 'shorts') {
    return (
      <ShortsFeed 
        videos={videos}
        onBack={goBack}
        onVideoClick={(video) => setView({ type: 'video', video })}
        onChannelClick={(channelId) => setView({ type: 'channel', channelId })}
      />
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-black">
      <BotEngine />
      {/* Sidebar - Brutalist Setup */}
      <aside className="w-64 border-r-2 border-zinc-900 bg-zinc-950 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-zinc-900 cursor-pointer" onClick={() => setView({ type: 'home' })}>
          <div className="w-full flex items-center justify-between">
            <span className="font-display text-2xl font-bold tracking-tighter text-lime-400">KynxTV</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">Vol. 1</span>
          </div>
        </div>
        
        <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
          <NavItem 
            icon={<Compass />} 
            label={t('Explore')} 
            active={view.type === 'home' && activeTab === 'explore'} 
            onClick={() => { setView({ type: 'home' }); setActiveTab('explore'); }}
          />
          <NavItem 
            icon={<Flame />} 
            label={t('Trending')} 
            active={view.type === 'home' && activeTab === 'trending'}
            onClick={() => { setView({ type: 'home' }); setActiveTab('trending'); }}
          />
          <NavItem 
            icon={<Smartphone />} 
            label={t('Shorts Feed')} 
            active={view.type === 'shorts'}
            onClick={() => setView({ type: 'shorts' })}
          />
          <NavItem 
            icon={<Hash />} 
            label={t('Tag Search')} 
            active={view.type === 'ai'}
            onClick={() => setView({ type: 'ai' })}
          />
          <NavItem 
            icon={<MessageCircle />} 
            label={t('Community')} 
            active={view.type === 'posts'}
            onClick={() => setView({ type: 'posts' })}
          />
          <NavItem 
            icon={<MessageSquare />} 
            label={t('Comms')} 
            active={view.type === 'chats'}
            onClick={() => setView({ type: 'chats' })}
          />
          <NavItem 
            icon={<ListVideo />} 
            label={t('Playlists')} 
            active={view.type === 'playlists'}
            onClick={() => setView({ type: 'playlists' })}
          />
          <NavItem 
            icon={<History />} 
            label={t('History')} 
            active={view.type === 'history'}
            onClick={() => setView({ type: 'history' })}
          />
          
          <div className="my-8 border-t border-zinc-900" />
          
          <NavItem 
            icon={<User />} 
            label={t('My Channel')} 
            active={view.type === 'channel' && view.channelId === myChannel?.id}
            onClick={() => myChannel && setView({ type: 'channel', channelId: myChannel.id })}
          />
          <NavItem 
            icon={<Radio />} 
            label={t('Go Live')} 
            active={view.type === 'live' && view.channelId === myChannel?.id}
            onClick={() => myChannel && setView({ type: 'live', channelId: myChannel.id })}
          />
          <NavItem 
            icon={<Plus />} 
            label={t('New Post')} 
            active={false}
            onClick={() => setIsCreatingPost(true)}
          />
          <NavItem 
            icon={<Shield />} 
            label="Impressum" 
            active={view.type === 'impressum'}
            onClick={() => setView({ type: 'impressum' })}
          />
          <NavItem 
            icon={<Settings />} 
            label="Settings" 
            active={false}
            onClick={() => alert("Settings opened")}
          />
        </nav>

        <div className="p-6 border-t border-zinc-900 space-y-4">
          <select 
             value={lang} 
             onChange={(e) => setLang(e.target.value as any)}
             className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-widest text-[10px] p-2 rounded-lg"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
          <button 
            onClick={() => setIsUploading(true)}
            className="w-full py-4 px-4 bg-lime-400 hover:bg-lime-500 text-lime-950 font-display font-bold uppercase tracking-widest text-xs transition-all rounded-[2rem] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.15)] hover:shadow-[0_0_30px_rgba(163,230,53,0.3)]"
          >
            <Plus className="w-4 h-4" />
            {t('Upload Video')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-zinc-950">
        {/* Top Navbar */}
        <header className="h-20 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          {/* Mobile Logo & Return */}
          <div className="md:hidden flex items-center cursor-pointer gap-2" onClick={view.type !== 'home' ? goBack : () => setView({ type: 'home' })}>
            {view.type !== 'home' ? (
              <>
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-400 font-bold uppercase text-xs">{t('Return')}</span>
              </>
            ) : (
              <span className="font-display text-2xl font-bold tracking-tighter text-lime-400">KynxTV</span>
            )}
          </div>

          {/* Search */}
          {view.type === 'home' && (
            <div className="flex-1 max-w-xl mx-auto hidden md:block">
              <div className="relative group flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-zinc-500 group-focus-within:text-lime-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="SEARCH ARCHIVES..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[2rem] pl-12 pr-4 py-3 text-sm font-bold tracking-widest uppercase text-zinc-100 focus:outline-none focus:border-lime-400 transition-all placeholder-zinc-600 focus:bg-zinc-900"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 text-zinc-400 hover:text-zinc-100 transition-colors hidden md:block"
              onClick={() => alert(t('No new notifications'))}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-lime-400 rounded-full border-2 border-zinc-950"></span>
            </button>
            <div className="md:hidden">
              <button 
                onClick={() => setIsUploading(true)} 
                className="p-3 bg-lime-400 text-lime-950 rounded-full hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.2)]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {myChannel && (
              <div 
                className="w-10 h-10 bg-zinc-800 cursor-pointer ring-2 ring-transparent hover:ring-lime-400 flex items-center justify-center overflow-hidden rounded-[1rem] transition-all"
                onClick={() => setView({ type: 'channel', channelId: myChannel.id })}
              >
                {myChannel.avatar ? (
                  <img src={myChannel.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-zinc-400">{myChannel.displayName.charAt(0)}</span>
                )}
              </div>
            )}
          </div>
        </header>

        {view.type === 'home' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:px-16">
            {videos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                <div className="w-24 h-24 mb-8 border border-zinc-800 rounded-full flex items-center justify-center bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] text-lime-400">
                  <Layers className="w-10 h-10" />
                </div>
                <h2 className="font-display text-3xl font-bold uppercase tracking-widest mb-4 text-zinc-100">Empty Signal</h2>
                <p className="text-zinc-500 mb-8 font-medium font-sans text-sm leading-relaxed">
                  No transmissions found. Initiate a local upload to populate your frequency.
                </p>
                <button 
                  onClick={() => setIsUploading(true)}
                  className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-12 py-4 rounded-full hover:bg-lime-500 hover:shadow-[0_0_30px_rgba(163,230,53,0.2)] transition-all"
                >
                  Initiate Upload
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-12">
                  <h2 className="font-display text-4xl lg:text-6xl font-bold uppercase tracking-tighter">
                    {activeTab === 'explore' ? 'Global Feed' : 'Trending'}
                  </h2>
                  <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 pb-2 hidden sm:block">
                    {displayVideos.length} Resonances
                  </span>
                </div>
                
                {displayVideos.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 font-display font-bold uppercase tracking-widest">
                    No matching signal found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                    {displayVideos.map(video => (
                      <VideoCard 
                        key={video.id} 
                        video={video} 
                        onClick={() => setView({ type: 'video', video })}
                        onChannelClick={(id) => setView({ type: 'channel', channelId: id })}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : view.type === 'posts' ? (
          <div className="flex-1 overflow-y-auto w-full">
            <PostsFeed />
          </div>
        ) : view.type === 'ai' ? (
          <AIAssistant 
            videos={videos}
            onVideoClick={(video) => setView({ type: 'video', video })}
          />
        ) : view.type === 'chats' ? (
          <ChatsView 
            initialUserId={view.initialUserId}
            onBack={goBack} 
            onChannelClick={(channelId) => setView({ type: 'channel', channelId })} 
          />
        ) : view.type === 'history' ? (
          <div className="flex-1 overflow-y-auto w-full">
            <HistoryView onVideoClick={(video) => setView({ type: 'video', video })} />
          </div>
        ) : view.type === 'playlists' ? (
          <div className="flex-1 overflow-y-auto w-full">
            <PlaylistsView onVideoClick={(video) => setView({ type: 'video', video })} />
          </div>
        ) : view.type === 'channel' ? (
           <ChannelView 
            channelId={view.channelId} 
            onVideoClick={(video) => setView({ type: 'video', video })} 
            onEditClick={() => setIsEditingChannel(true)}
            onLiveClick={(channelId) => setView({ type: 'live', channelId })}
            onMessageClick={(channelId) => {
              setView({ type: 'chats', initialUserId: channelId });
            }}
          />
        ) : view.type === 'impressum' ? (
          <Impressum onBack={goBack} />
        ) : null}
      </main>

      {isCreatingPost && (
        <CreatePostModal 
          onPostCreated={() => { setIsCreatingPost(false); setView({ type: 'posts' }); }}
          onCancel={() => setIsCreatingPost(false)}
        />
      )}

      {isUploading && (
        <UploadModal 
          onClose={() => { setIsUploading(false); loadVideos(); }} 
          onUploadComplete={(meta) => {
            setVideos([meta, ...videos]);
            loadVideos();
          }}
        />
      )}

      {isEditingChannel && myChannel && (
        <ChannelEdit 
          channel={myChannel} 
          onClose={() => setIsEditingChannel(false)} 
          onSave={loadMyChannel}
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 font-display font-bold tracking-widest text-sm uppercase transition-all rounded-[2rem] ${
      active 
        ? "bg-lime-400/10 text-lime-400 border border-lime-400/20" 
        : "text-zinc-500 border border-transparent hover:bg-zinc-900 hover:text-zinc-300"
    }`}>
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      <span>{label}</span>
      {active && <span className="ml-auto w-1.5 h-1.5 bg-lime-400 rounded-full shadow-[0_0_10px_rgba(163,230,53,0.8)]" />}
    </button>
  );
}

function VideoCard({ video, onClick, onChannelClick }: { video: VideoMeta, onClick: () => void, onChannelClick: (id: string) => void, key?: React.Key }) {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    getChannel(video.channelId).then(ch => setChannel(ch || null));
  }, [video]);

  return (
    <div className="group flex flex-col gap-4">
      <div 
        className="relative aspect-video bg-zinc-900 cursor-pointer overflow-hidden rounded-[1.5rem] transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_10px_40px_-15px_rgba(163,230,53,0.15)] ring-1 ring-zinc-800 group-hover:ring-lime-400/50"
        onClick={onClick}
      >
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className={`w-full h-full transition-all duration-700 group-hover:scale-105 ${video.isShort ? 'object-contain' : 'object-cover'}`}
        />
        
        {video.isShort && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-lime-400/90 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest text-lime-950 uppercase border border-lime-300">
            Short
          </div>
        )}

        {video.duration !== undefined && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest text-white uppercase border border-zinc-700/50">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      
      <div className="flex gap-4 px-1">
        <div 
          className="w-10 h-10 bg-zinc-800 rounded-[1rem] flex items-center justify-center shrink-0 cursor-pointer overflow-hidden hover:ring-2 hover:ring-lime-400 transition-all"
          onClick={() => onChannelClick(video.channelId)}
        >
          {channel?.avatar ? (
            <img src={channel.avatar} alt="Ch" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-bold text-zinc-400">
              {channel?.displayName.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h3 
            className="font-display font-bold text-zinc-100 text-[15px] leading-tight truncate cursor-pointer hover:text-lime-400 transition-colors"
            onClick={onClick}
          >
            {video.title}
          </h3>
          <p 
            className="text-xs font-semibold text-zinc-400 mt-1 cursor-pointer hover:text-zinc-300 transition-colors truncate"
            onClick={() => onChannelClick(video.channelId)}
          >
            {channel?.displayName || 'Unknown'}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-zinc-500">
            <span>{video.views || 0} views</span>
            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
            <span>{formatTimeAgo(video.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
