import { Compass, Sparkles, Flame, Shield, Youtube, Plus, Search, Layers, User, Radio, Smartphone, Hash, MessageCircle, MessageSquare, History, ListVideo, Bell, Settings, ArrowLeft, Menu, X, Gamepad2, Timer, Headphones, Calendar, Trophy, ShoppingBag } from "lucide-react";
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
import { StudioView } from "./components/StudioView";
import { getVideosMeta, getMyChannelId, getChannel, checkMigration, getChannels } from "./db";
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
  | { type: 'arcade' }
  | { type: 'timeMachine' }
  | { type: 'podcasts' }
  | { type: 'events' }
  | { type: 'leaderboard' }
  | { type: 'settings' }
  | { type: 'studio', videoId?: string }
  | { type: 'impressum' };

const CATEGORIES = ['All', 'Gaming', 'Music', 'Tech', 'Vlogs', 'Education', 'Entertainment'];

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{progress: number, title: string} | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [miniPlayer, setMiniPlayer] = useState<{type: 'video', video: VideoMeta} | {type: 'live', channelId: string} | null>(null);
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
    const channelsList = await getChannels();
    setAllChannels(channelsList);
  };

  const loadMyChannel = async () => {
    const id = await getMyChannelId();
    const ch = await getChannel(id);
    if (ch) setMyChannel(ch);
  };

  const filteredChannels = allChannels.filter(c => 
    (c.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.handle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredLiveStreams = filteredChannels.filter(c => c.isLive);
  
  const filteredVideos = videos.filter(v => {
    const matchesSearch = (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (v.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (v.hashtags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    
    if (selectedCategory !== 'All') {
      const matchCat = selectedCategory.toLowerCase();
      const matchesCategory = (v.hashtags || []).some(tag => tag.toLowerCase() === matchCat) ||
                              (v.title || '').toLowerCase().includes(matchCat) ||
                              (v.description || '').toLowerCase().includes(matchCat);
      if (!matchesCategory) return false;
    }
    return true;
  });

  // Simple algorithm for trending
  const displayVideos = activeTab === 'trending' 
    ? [...filteredVideos].sort((a,b) => b.views - a.views)
    : [...filteredVideos].sort((a,b) => b.timestamp - a.timestamp); // explore by date

  if (view.type === 'video') {
    return (
      <VideoPlayer 
        video={view.video} 
        onBack={goBack}
        onMinimize={() => {
          setMiniPlayer({ type: 'video', video: view.video });
          goBack();
        }}
        onDeleted={(id) => {
          goBack();
          loadVideos();
        }}
        onChannelClick={(channelId) => setView({ type: 'channel', channelId })}
        onVideoClick={(video) => setView({ type: 'video', video })}
        onEditInStudio={() => setView({ type: 'studio', videoId: view.video.id })}
      />
    );
  }

  if (view.type === 'live') {
    return (
      <LiveStream 
        channelId={view.channelId}
        onBack={goBack}
        onMinimize={() => {
          setMiniPlayer({ type: 'live', channelId: view.channelId });
          goBack();
        }}
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
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Brutalist Setup */}
      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative bg-zinc-950 flex flex-col shrink-0 ${isMobileSidebarOpen ? 'translate-x-0 w-64 border-r-2 border-zinc-900' : '-translate-x-full w-64 border-r-2 border-zinc-900'} md:translate-x-0 ${isDesktopSidebarOpen ? 'md:w-64 md:border-r-2 md:border-zinc-900' : 'md:w-0 md:opacity-0 md:overflow-hidden md:border-none md:p-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-zinc-900 cursor-pointer" onClick={() => { setView({ type: 'home' }); setIsMobileSidebarOpen(false); }}>
          <div className="w-full flex items-center justify-between">
            <span className="font-display text-2xl font-bold tracking-tighter text-lime-400">KynxTV</span>
            <button className="md:hidden text-zinc-400" onClick={(e) => { e.stopPropagation(); setIsMobileSidebarOpen(false); }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
          <NavItem 
            icon={<Compass />} 
            label={t('Explore')} 
            active={view.type === 'home' && activeTab === 'explore'} 
            onClick={() => { setView({ type: 'home' }); setActiveTab('explore'); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Flame />} 
            label={t('Trending')} 
            active={view.type === 'home' && activeTab === 'trending'}
            onClick={() => { setView({ type: 'home' }); setActiveTab('trending'); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Smartphone />} 
            label={t('Shorts Feed')} 
            active={view.type === 'shorts'}
            onClick={() => { setView({ type: 'shorts' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Hash />} 
            label={t('Tag Search')} 
            active={view.type === 'ai'}
            onClick={() => { setView({ type: 'ai' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<MessageCircle />} 
            label={t('Community')} 
            active={view.type === 'posts'}
            onClick={() => { setView({ type: 'posts' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<MessageSquare />} 
            label={t('Comms')} 
            active={view.type === 'chats'}
            onClick={() => { setView({ type: 'chats' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<ListVideo />} 
            label={t('Playlists')} 
            active={view.type === 'playlists'}
            onClick={() => { setView({ type: 'playlists' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<History />} 
            label={t('History')} 
            active={view.type === 'history'}
            onClick={() => { setView({ type: 'history' }); setIsMobileSidebarOpen(false); }}
          />
          
          <div className="my-8 border-t border-zinc-900" />
          
          <NavItem 
            icon={<User />} 
            label={t('My Channel')} 
            active={view.type === 'channel' && view.channelId === myChannel?.id}
            onClick={() => { myChannel && setView({ type: 'channel', channelId: myChannel.id }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Radio />} 
            label={t('Go Live')} 
            active={view.type === 'live' && view.channelId === myChannel?.id}
            onClick={() => { myChannel && setView({ type: 'live', channelId: myChannel.id }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Gamepad2 />} 
            label={t('Arcade')} 
            active={view.type === 'arcade'}
            onClick={() => { setView({ type: 'arcade' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Calendar />} 
            label={t('Events') || 'Events'} 
            active={view.type === 'events'}
            onClick={() => { setView({ type: 'events' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Trophy />} 
            label={t('Leaderboard') || 'Leaderboard'} 
            active={view.type === 'leaderboard'}
            onClick={() => { setView({ type: 'leaderboard' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Settings />} 
            label={t('Settings') || "Settings"} 
            active={view.type === 'settings'}
            onClick={() => { setView({ type: 'settings' }); setIsMobileSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Plus className="w-5 h-5"/>} 
            label={t('Studio') || "KynxTV Studio"} 
            active={view.type === 'studio'}
            onClick={() => { setView({ type: 'studio' }); setIsMobileSidebarOpen(false); }}
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
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsUploading(true); setIsMobileSidebarOpen(false); }}
              className="flex-1 py-4 px-4 bg-lime-400 hover:bg-lime-500 text-lime-950 font-display font-bold uppercase tracking-widest text-xs transition-all rounded-[2rem] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.15)] hover:shadow-[0_0_30px_rgba(163,230,53,0.3)]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              {t('Upload Video')}
            </button>
            <button 
              onClick={() => { setIsCreatingPost(true); setIsMobileSidebarOpen(false); }}
              className="w-14 items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-100 hover:text-lime-400 hover:border-lime-400 transition-colors rounded-[2rem] flex tooltip group relative shrink-0"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-zinc-800 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">{t('New Post')}</span>
            </button>
          </div>
          
          <div className="text-[10px] text-zinc-500 font-sans leading-relaxed pt-4 pb-8 border-t border-zinc-900 mt-4">
            <p className="font-bold mb-2 uppercase tracking-widest text-zinc-400">Impressum</p>
            <p className="mb-2 hover:text-zinc-300 transition-colors">
              <strong>Marcel Koukoui</strong><br/>
              Rummelsberg 31 C<br/>
              alpinfnfirst@gmx.de
            </p>
            <p className="mb-2 hover:text-zinc-300 transition-colors">
              <strong>Vertreten durch:</strong><br/>
              Marcel Koukoui
            </p>
            <p className="mb-2 hover:text-zinc-300 transition-colors">
              <strong>Verantwortlich für redaktionelle Inhalte:</strong><br/>
              Marcel Koukoui
            </p>
            <p className="text-[9px] mt-4 opacity-50 hover:opacity-100 transition-opacity">
              Platform strictly monitored by autonomous AI Core. All actions recorded in the archives.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-zinc-950">
        {/* Top Navbar */}
        <header className="h-20 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          {/* Menu & Logo & Return */}
          <div className="flex items-center cursor-pointer gap-4">
            {view.type !== 'home' ? (
              <div className="flex items-center gap-2" onClick={goBack}>
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-400 font-bold uppercase text-xs hidden sm:inline">{t('Return')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button className="text-zinc-400 p-2 md:hidden" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
                  <Menu className="w-6 h-6" />
                </button>
                <button className="text-zinc-400 p-2 hidden md:block hover:text-white transition-colors" onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}>
                  <Menu className="w-6 h-6" />
                </button>
                <span className="font-display text-2xl font-bold tracking-tighter text-lime-400 hidden sm:block">KynxTV</span>
              </div>
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
          <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:px-16 flex flex-col">
            {/* Category Filter */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 sticky top-0 bg-zinc-950 z-10 shrink-0" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${selectedCategory === cat ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'bg-zinc-900/50 text-zinc-400 hover:text-lime-400 border-zinc-800 hover:border-lime-400/50'}`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>

            {videos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center">
                <div className="w-24 h-24 mb-8 border border-zinc-800 rounded-full flex items-center justify-center bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] text-lime-400">
                  <Layers className="w-10 h-10" />
                </div>
                <h2 className="font-display text-3xl font-bold uppercase tracking-widest mb-4 text-zinc-100">{t('Empty Signal') || 'Empty Signal'}</h2>
                <p className="text-zinc-500 mb-8 font-medium font-sans text-sm leading-relaxed">
                  {t('No transmissions found. Initiate a local upload to populate your frequency.') || 'No transmissions found. Initiate a local upload to populate your frequency.'}
                </p>
                <button 
                  onClick={() => setIsUploading(true)}
                  className="font-display font-bold uppercase tracking-widest text-sm bg-lime-400 text-lime-950 px-12 py-4 rounded-full hover:bg-lime-500 hover:shadow-[0_0_30px_rgba(163,230,53,0.2)] transition-all"
                >
                  {t('Initiate Upload') || 'Initiate Upload'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-12">
                  <h2 className="font-display text-4xl lg:text-6xl font-bold uppercase tracking-tighter">
                    {searchQuery ? (t('Search Results') || 'Search Results') : activeTab === 'explore' ? t('Global Feed') : t('Trending')}
                  </h2>
                  <span className="text-xs font-bold tracking-widest uppercase text-zinc-500 pb-2 hidden sm:block">
                    {searchQuery ? `${filteredChannels.length} ${t('Channels') || 'Channels'}, ${displayVideos.length} ${t('Videos') || 'Videos'}` : `${displayVideos.length} ${t('Resonances') || 'Resonances'}`}
                  </span>
                </div>
                
                {searchQuery && filteredChannels.length > 0 && (
                  <div className="mb-12">
                    <h3 className="font-bold uppercase tracking-widest text-zinc-400 mb-6 text-sm border-b border-zinc-800 pb-2">{t('Channels & Profiles') || 'Channels & Profiles'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {filteredChannels.map(channel => (
                        <div key={channel.id} onClick={() => setView({ type: 'channel', channelId: channel.id })} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-lime-400/50 transition-all group">
                          {channel.avatar ? (
                            <img src={channel.avatar} className="w-16 h-16 rounded-full object-cover mb-3" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 font-bold mb-3">
                              {channel.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <p className="font-bold text-center w-full truncate group-hover:text-lime-400">{channel.displayName || channel.handle}</p>
                          <p className="text-xs text-zinc-500">{channel.subscribers?.length || 0} Subs</p>
                          {channel.isLive && (
                            <div className="mt-3 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] uppercase font-bold tracking-wider rounded-full animate-pulse">
                              Live
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchQuery && filteredLiveStreams.length > 0 && (
                  <div className="mb-12">
                    <h3 className="font-bold uppercase tracking-widest text-zinc-400 mb-6 text-sm border-b border-zinc-800 pb-2">Live Streams</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filteredLiveStreams.map(channel => (
                        <div key={channel.id} onClick={() => setView({ type: 'live', channelId: channel.id })} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer hover:border-red-500/50 transition-all group relative overflow-hidden">
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-full animate-pulse z-10">Live</div>
                          <div className="flex items-center gap-3 relative z-10">
                            {channel.avatar ? (
                              <img src={channel.avatar} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold">{channel.displayName?.[0] || '?'}</div>
                            )}
                            <div>
                              <p className="font-bold group-hover:text-red-400 transition-colors">{channel.displayName}</p>
                              <p className="text-xs text-zinc-500">@{channel.handle}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(searchQuery) && <h3 className="font-bold uppercase tracking-widest text-zinc-400 mb-6 text-sm border-b border-zinc-800 pb-2">Videos</h3>}

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
        ) : view.type === 'arcade' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
            <Gamepad2 className="w-24 h-24 text-lime-400 mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4 tracking-tighter">Kynx Arcade</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">Play mini-games while watching your favorite streams. Compete on the global leaderboard.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              <div 
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-lime-400/50 cursor-pointer transition-colors"
                onClick={() => {
                  alert("Game started! Score: " + Math.floor(Math.random() * 1000));
                }}
              >
                <h3 className="font-bold mb-2">Snake Stream</h3>
                <p className="text-xs text-zinc-500">Classic snake overlay.</p>
              </div>
              <div 
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-lime-400/50 cursor-pointer transition-colors"
                onClick={() => {
                  const answer = prompt("What is 10 + 10?");
                  if (answer === "20") alert("Correct! You earn 50 Kynx Coins.");
                  else alert("Wrong! Better luck next time.");
                }}
              >
                <h3 className="font-bold mb-2">Chat Trivia</h3>
                <p className="text-xs text-zinc-500">Live community quizzes.</p>
              </div>
            </div>
          </div>
        ) : view.type === 'timeMachine' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center bg-zinc-950">
            <Timer className="w-24 h-24 text-orange-400 mb-6 animate-[spin_10s_linear_infinite]" />
            <h2 className="text-3xl font-display font-bold mb-4 tracking-tighter text-orange-400">Time Machine</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">Travel back to see the platform exactly as it was on any given date. Experience nostalgia.</p>
            <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-full border border-zinc-800">
              <input type="date" className="bg-transparent border-none outline-none text-zinc-100 px-4 py-2" defaultValue="2010-01-01" id="time-date" />
              <button 
                onClick={() => {
                  const dateInfo = (document.getElementById('time-date') as HTMLInputElement).value;
                  const year = dateInfo.split('-')[0];
                  if (parseInt(year) < 2015) {
                    document.body.style.filter = "sepia(0.8) contrast(1.2)";
                  } else {
                    document.body.style.filter = "none";
                  }
                  setView({ type: 'home' });
                }}
                className="bg-orange-500 text-black font-bold uppercase text-xs tracking-widest px-6 py-3 rounded-full hover:bg-orange-400">
                Travel
              </button>
            </div>
          </div>
        ) : view.type === 'podcasts' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
            <Headphones className="w-24 h-24 text-purple-400 mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4 tracking-tighter">Podcasts</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">Listen to exclusive platform podcasts while your screen is locked.</p>
            <button onClick={() => alert("Playing: The Daily Sync - Episode 42")} className="bg-purple-500 text-white font-bold uppercase text-xs tracking-widest px-8 py-4 rounded-full hover:bg-purple-400">Start Listening</button>
          </div>
        ) : view.type === 'events' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
            <Calendar className="w-24 h-24 text-blue-400 mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4 tracking-tighter">Live Events</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">Upcoming global premieres, tournaments, and exclusive community gatherings.</p>
            <button onClick={() => alert("You have registered for the upcoming Summer E-Sports Cup!")} className="bg-blue-500 text-white font-bold uppercase text-xs tracking-widest px-8 py-4 rounded-full hover:bg-blue-400">Register</button>
          </div>
        ) : view.type === 'leaderboard' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
            <Trophy className="w-24 h-24 text-yellow-400 mb-6" />
            <h2 className="text-3xl font-display font-bold mb-4 tracking-tighter">Creator Awards</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">Top trending creators, real-time subscriber races, and monthly platform awards.</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full max-w-sm">
              {[...allChannels].sort((a, b) => (b.subscribers?.length || 0) - (a.subscribers?.length || 0)).slice(0, 5).map((channel, idx) => (
                <div key={channel.id} className={`flex justify-between py-3 ${idx < 4 ? 'border-b border-zinc-800' : ''}`} onClick={() => setView({ type: 'channel', channelId: channel.id })}>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${idx === 0 ? 'text-lime-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>{idx + 1}.</span>
                    {channel.profileUrl ? (
                      <img src={channel.profileUrl} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">{channel.displayName?.[0] || channel.name?.[0] || '?'}</div>
                    )}
                    <span className="font-bold cursor-pointer hover:text-lime-400">{channel.displayName || channel.name}</span>
                  </div>
                  <span className="text-zinc-500">{channel.subscribers?.length || 0} Subs</span>
                </div>
              ))}
            </div>
          </div>
        ) : view.type === 'studio' ? (
          <StudioView 
            onClose={() => setView({ type: 'home' })} 
            initialVideo={view.type === 'studio' && view.videoId ? videos.find(v => v.id === view.videoId) : undefined} 
          />
        ) : view.type === 'settings' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 mb-20 lg:px-16 max-w-3xl mx-auto w-full">
            <h2 className="text-2xl font-display font-bold mb-8 uppercase tracking-tighter flex items-center gap-3">
              <Settings className="w-6 h-6 text-lime-400" /> Platform Settings
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs mb-4 border-b border-zinc-900 pb-2">Language & Region</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Interface Language</p>
                    <p className="text-xs text-zinc-500">Change platform language</p>
                  </div>
                  <select 
                     value={lang} 
                     onChange={(e) => setLang(e.target.value as any)}
                     className="bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-xs p-2 rounded-lg"
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs mb-4 border-b border-zinc-900 pb-2">Appearance</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center mb-2">
                  <div>
                    <p className="font-bold text-sm">Dark Mode</p>
                    <p className="text-xs text-zinc-500">Dark mode is permanently enforced.</p>
                  </div>
                  <div className="w-10 h-5 bg-lime-400 rounded-full relative opacity-50 cursor-not-allowed">
                    <div className="w-4 h-4 bg-lime-950 rounded-full absolute right-0.5 top-0.5"></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase tracking-widest text-zinc-500 text-xs mb-4 border-b border-zinc-900 pb-2">Data & Privacy</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-red-500">Clear Local History</p>
                    <p className="text-xs text-zinc-500">Removes watch history and local data</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your local history?")) {
                        window.localStorage.removeItem('video_history');
                        alert("History cleared.");
                      }
                    }}
                    className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold uppercase hover:bg-red-500/20"
                  >
                    Clear Data
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </main>

      {/* Mini Player */}
      {miniPlayer && view.type !== 'video' && view.type !== 'live' && view.type !== 'shorts' && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-72 md:w-80 aspect-video bg-black rounded-[1rem] md:rounded-[1.5rem] border border-zinc-800 shadow-2xl overflow-hidden z-20 group">
          <button 
            onClick={() => setMiniPlayer(null)} 
            className="absolute top-2 right-2 text-white bg-black/60 rounded-full p-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
          >
            <X className="w-4 h-4" />
          </button>
          <div 
            className="absolute inset-0 z-10 cursor-pointer border-2 border-transparent hover:border-lime-400 transition-colors pointer-events-auto"
            onClick={() => {
              if (miniPlayer.type === 'video') setView({type: 'video', video: miniPlayer.video});
              else setView({type: 'live', channelId: miniPlayer.channelId});
              setMiniPlayer(null);
            }}
          />
          {miniPlayer.type === 'video' ? (
             <video src={miniPlayer.video.videoUrl} autoPlay muted loop className="w-full h-full object-cover"/>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
                <span className="text-red-500 font-bold animate-pulse text-xl uppercase tracking-widest">LIVE</span>
             </div>
          )}
        </div>
      )}

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
            setIsUploading(false);
            setUploadProgress({ progress: 0, title: meta.title });
            
            // Simulate upload progress
            let current = 0;
            const interval = setInterval(() => {
              current += Math.random() * 15;
              if (current >= 100) {
                current = 100;
                clearInterval(interval);
                setTimeout(() => {
                  setUploadProgress(null);
                  setVideos(prev => [meta, ...prev]);
                  loadVideos();
                }, 1000);
              }
              setUploadProgress({ progress: Math.min(Math.round(current), 100), title: meta.title });
            }, 300);
          }}
        />
      )}

      {/* Upload Progress Bar */}
      {uploadProgress && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 truncate pr-4">Uploading: {uploadProgress.title}</span>
            <span className="text-xs font-bold text-lime-400">{uploadProgress.progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-lime-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
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
