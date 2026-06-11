import { ArrowLeft, MoreVertical, Trash2, Settings, Edit2, PlaySquare, Subtitles, Smile, X, ListPlus, Link2, Download, ThumbsDown, Gauge } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getVideoFile, deleteVideo, getChannel, getMyChannelId, toggleSubscribe, addView, getVideosMeta, addHistoryItem, addReaction, updateVideoMeta, getPlaylists, updatePlaylist } from "../db";
import { VideoMeta, Channel, SubtitleStyle, Playlist } from "../types";
import { formatTimeAgo, formatDuration } from "../utils";
import { Comments } from "./Comments";
import { EditVideoModal } from "./EditVideoModal";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface VideoPlayerProps {
  video: VideoMeta;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onChannelClick: (channelId: string) => void;
  onVideoClick: (video: VideoMeta) => void;
}

const QUALITY_OPTIONS = ['180p', '360p', '480p', '720p', '1080p', '1440p', '4K', '8K'];
const REACTIONS = ['🔥', '❤️', '🚀', '😂', '🤯'];

export function VideoPlayer({ video, onBack, onDeleted, onChannelClick, onVideoClick }: VideoPlayerProps) {
  const { t } = useLanguage();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [quality, setQuality] = useState('1080p');
  const [isBuffering, setIsBuffering] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localMeta, setLocalMeta] = useState<VideoMeta>(video);
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [myId, setMyId] = useState('');
  const [recommended, setRecommended] = useState<VideoMeta[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // New features
  const [liveReactions, setLiveReactions] = useState<{id: string, emoji: string, left: number}[]>([]);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>({ fontSize: 'text-xl', color: 'text-white', background: 'bg-black/50' });
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    let url = "";
    let mounted = true;
    setLocalMeta(video);

    // Increment Views
    addView(video.id);
    // Add to history
    addHistoryItem(video.id);

    // Fetch dependencies
    Promise.all([
      getVideoFile(video.id),
      getChannel(video.channelId),
      getMyChannelId(),
      getVideosMeta(),
      getPlaylists()
    ]).then(([file, ch, myChannelId, allVids, pl]) => {
      if (mounted) {
        if (file) {
          url = URL.createObjectURL(file);
          setVideoUrl(url);
        } else if (video.videoUrl) {
          setVideoUrl(video.videoUrl);
        }
        setChannel(ch || null);
        setMyId(myChannelId);
        setMyPlaylists(pl.filter(p => p.channelId === myChannelId));
        
        // Algorithm: Mix of same channel + matching hashtags + trending
        const others = allVids.filter(v => v.id !== video.id);
        
        const scored = others.map(v => {
          let score = 0;
          if (v.channelId === video.channelId) score += 50;
          if (v.hashtags && video.hashtags) {
            const common = v.hashtags.filter(tag => video.hashtags?.includes(tag));
            score += common.length * 20;
          }
          score += Math.min(v.views, 100) * 0.1;
          const ageHours = (Date.now() - v.timestamp) / (1000 * 60 * 60);
          score += Math.max(0, 10 - ageHours);
          return { video: v, score };
        });

        const sorted = scored.sort((a,b) => b.score - a.score).map(s => s.video).slice(0, 8);
        setRecommended(sorted);
      }
    });

    return () => {
      mounted = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [video.id]);

  useEffect(() => {
    if (!showSubtitles || !videoRef.current) return;
    const interval = setInterval(() => {
      const time = videoRef.current?.currentTime || 0;
      setCurrentSubtitle(`[Auto-generated caption] Sound frequency matching pattern at ${Math.floor(time)}s...`);
    }, 1000);
    return () => clearInterval(interval);
  }, [showSubtitles]);

  const handleDelete = async () => {
    if (confirm("DELETE THIS TRANSMISSION? THIS ACTION IS IRREVERSIBLE.")) {
      setShowMenu(false);
      await deleteVideo(video.id);
      onDeleted(video.id);
    }
  };

  const handleSub = async () => {
    if (!channel) return;
    await toggleSubscribe(channel.id, myId);
    const updated = await getChannel(channel.id);
    setChannel(updated || null);
  };

  const changeQuality = (q: string) => {
    setShowQuality(false);
    if (q === quality) return;
    setIsBuffering(true);
    setQuality(q);
    setTimeout(() => {
      setIsBuffering(false);
    }, 600 + Math.random() * 500);
  };

  const handleReaction = async (emoji: string) => {
    const newReac = { id: crypto.randomUUID(), emoji, left: Math.random() * 80 + 10 };
    setLiveReactions(prev => [...prev, newReac]);
    setTimeout(() => {
      setLiveReactions(prev => prev.filter(r => r.id !== newReac.id));
    }, 2500);
    await addReaction(video.id, emoji);
    setLocalMeta(prev => {
      const updated = { ...prev };
      if (!updated.reactions) updated.reactions = {};
      updated.reactions[emoji] = (updated.reactions[emoji] || 0) + 1;
      return updated;
    });
  };

  const getQualityStyles = (q: string): React.CSSProperties => {
    switch (q) {
      case '180p': return { filter: 'blur(3px) contrast(0.8)', transform: 'scale(1.02)' };
      case '360p': return { filter: 'blur(1.5px)', transform: 'scale(1.01)' };
      case '480p': return { filter: 'blur(0.8px)', transform: 'scale(1.005)' };
      case '720p': return { filter: 'blur(0.3px)' };
      default: return {};
    }
  };

  const togglePlaylist = async (p: Playlist) => {
    const updated = { ...p };
    const idx = updated.videoIds.indexOf(video.id);
    if (idx >= 0) {
      updated.videoIds.splice(idx, 1);
    } else {
      updated.videoIds.push(video.id);
    }
    await updatePlaylist(updated);
    setMyPlaylists(prev => prev.map(x => x.id === updated.id ? updated : x));
  };

  const isMe = channel?.id === myId;
  const isSubscribed = channel?.subscribers.includes(myId);

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden relative">
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto overflow-x-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
          
          {/* Top Bar Navigation */}
          <div className="h-20 flex items-center px-6 shrink-0 border-b border-zinc-900 sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md">
            <button 
              onClick={onBack}
              className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 px-6 py-3 rounded-full shadow-sm hover:shadow-[0_0_15px_rgba(163,230,53,0.15)]"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('Return')}
            </button>
            <div className="flex-1" />
          </div>

          {/* Video Player */}
          <div className="w-full bg-black flex flex-col justify-center border-b border-zinc-900 border-x-0 relative group">
            <div className="w-full max-w-6xl mx-auto aspect-video relative overflow-hidden">
              {videoUrl ? (
                <>
                  <video 
                    ref={videoRef}
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    onEnded={() => {
                      if (recommended.length > 0) {
                        onVideoClick(recommended[0]);
                      }
                    }}
                    className="w-full h-full object-contain transition-all duration-300"
                    style={getQualityStyles(quality)}
                  />
                  {isBuffering && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-10">
                      <span className="font-display font-bold text-lime-400 tracking-widest uppercase animate-pulse">Buffering {quality}...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
                  <span className="font-display font-bold text-zinc-700 tracking-widest uppercase">Buffering Signal...</span>
                </div>
              )}
            </div>
            
            {/* Custom Control Bar (Quality Selector & Subtitles) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
                  className={`bg-black/60 backdrop-blur-md border border-zinc-700/50 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold hover:bg-black/80 transition-colors ${showSubtitles ? 'text-lime-400' : 'text-white'}`}
                >
                  <Subtitles className="w-4 h-4" />
                  CC
                </button>
                {showSubtitleSettings && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowSubtitleSettings(false)} />
                    <div className="absolute right-0 top-12 w-64 bg-zinc-900/95 backdrop-blur-md rounded-[1.5rem] border border-zinc-800 z-40 overflow-hidden shadow-2xl p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="font-bold text-xs uppercase tracking-widest text-zinc-400">Captions</span>
                        <button onClick={() => setShowSubtitles(!showSubtitles)} className={`w-10 h-5 rounded-full relative transition-colors ${showSubtitles ? 'bg-lime-400' : 'bg-zinc-700'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${showSubtitles ? 'left-5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      
                      {showSubtitles && (
                        <>
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Size</span>
                            <div className="flex gap-2">
                              {['text-sm', 'text-xl', 'text-3xl'].map(s => (
                                <button key={s} onClick={() => setSubtitleStyle(p => ({...p, fontSize: s}))} className={`flex-1 py-1 rounded-full text-xs font-bold ${subtitleStyle.fontSize === s ? 'bg-lime-400 text-lime-950' : 'bg-zinc-800 text-zinc-300'}`}>A</button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Color</span>
                            <div className="flex gap-2">
                              {['text-white', 'text-lime-400', 'text-yellow-400', 'text-cyan-400'].map(c => (
                                <button key={c} onClick={() => setSubtitleStyle(p => ({...p, color: c}))} className={`flex-1 py-2 rounded-full border border-zinc-700 ${subtitleStyle.color === c ? 'ring-2 ring-lime-400' : ''}`}>
                                  <div className={`w-3 h-3 rounded-full mx-auto bg-current ${c}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowQuality(!showQuality)}
                  className="bg-black/60 backdrop-blur-md border border-zinc-700/50 text-white rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold hover:bg-black/80 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {quality}
                </button>
                {showQuality && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowQuality(false)} />
                    <div className="absolute right-0 top-12 w-32 bg-zinc-900/90 backdrop-blur-md rounded-[1.5rem] border border-zinc-800 z-40 overflow-hidden shadow-2xl p-2 flex flex-col gap-1">
                      {QUALITY_OPTIONS.map(q => (
                        <button
                          key={q}
                          onClick={() => changeQuality(q)}
                          className={`w-full text-left px-4 py-2 text-xs font-bold rounded-full transition-colors ${quality === q ? 'bg-lime-400 text-lime-950 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'text-zinc-300 hover:bg-zinc-800'}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Reaction floating layer */}
            <div className="absolute inset-x-0 bottom-0 top-[50%] pointer-events-none overflow-hidden z-20">
              <AnimatePresence>
                {liveReactions.map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: -150, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="absolute bottom-10 text-3xl pointer-events-none drop-shadow-lg"
                    style={{ left: `${r.left}%` }}
                  >
                    {r.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Subtitle overlay */}
            {showSubtitles && currentSubtitle && (
              <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-[1rem] max-w-[80%] text-center backdrop-blur-sm ${subtitleStyle.background}`}>
                <p className={`font-display font-bold tracking-widest ${subtitleStyle.fontSize} ${subtitleStyle.color}`}>
                  {currentSubtitle}
                </p>
              </div>
            )}
          </div>

          {/* Details & Comments & Reactions */}
          <div className="w-full max-w-5xl mx-auto px-6 py-12">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-zinc-100 uppercase tracking-tighter mb-4 leading-none">
              {localMeta.title}
            </h1>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-12">
              <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                <span>{(localMeta.views || 0) + 1} Views</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                <span>{formatTimeAgo(localMeta.timestamp)}</span>
              </div>
              
              {/* Reactions Bar & Playlists */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-2 gap-2 flex-wrap">
                  {REACTIONS.map(emoji => {
                    const count = (localMeta.reactions && localMeta.reactions[emoji]) || 0;
                    return (
                      <button 
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 rounded-full transition-colors font-bold text-xs"
                      >
                        <span className="text-xl">{emoji}</span>
                        {count > 0 && <span className="text-zinc-400">{count}</span>}
                      </button>
                    )
                  })}
                  <button 
                    onClick={() => alert('Feedback recorded.')}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 rounded-full transition-colors font-bold text-xs text-zinc-400"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                      className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      <ListPlus className="w-4 h-4" />
                      Save
                    </button>
                    {showPlaylistMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowPlaylistMenu(false)} />
                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-zinc-900/95 backdrop-blur-md rounded-[1.5rem] border border-zinc-800 z-40 overflow-hidden shadow-2xl p-4 flex flex-col gap-2">
                          <span className="font-bold text-xs uppercase tracking-widest text-zinc-400 mb-2">Save to Playlist</span>
                        {myPlaylists.length === 0 ? (
                          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-center py-4">No playlists. Create one in the Playlists tab.</div>
                        ) : (
                          myPlaylists.map(p => {
                            const hasVideo = p.videoIds.includes(video.id);
                            return (
                              <button 
                                key={p.id}
                                onClick={() => togglePlaylist(p)}
                                className={`text-left px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-colors flex items-center justify-between ${hasVideo ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20' : 'text-zinc-300 hover:bg-zinc-800 border border-transparent'}`}
                              >
                                <span className="truncate">{p.title}</span>
                                {hasVideo && <span className="w-2 h-2 rounded-full bg-lime-400" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); }} className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors">
                    <Link2 className="w-4 h-4"/> Share
                  </button>
                  <button onClick={() => {
                    if (videoUrl) {
                      const a = document.createElement('a');
                      a.href = videoUrl;
                      a.download = `${video.title || 'video'}.mp4`;
                      a.click();
                    }
                  }} className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors">
                    <Download className="w-4 h-4"/> Download
                  </button>
                  <button onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.playbackRate = videoRef.current.playbackRate === 1 ? 1.5 : (videoRef.current.playbackRate === 1.5 ? 2 : 1);
                      alert(`Playback Rate: ${videoRef.current.playbackRate}x`);
                    }
                  }} className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors">
                    <Gauge className="w-4 h-4"/> Speed
                  </button>
                </div>
              </div>
              
              {isMe && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/20 hover:border-red-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Uploader Block */}
            <div className="flex items-center justify-between py-6 border-y border-zinc-900 mb-12">
              <div 
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => channel && onChannelClick(channel.id)}
              >
                <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center rounded-[1rem] ring-2 ring-transparent group-hover:ring-lime-400 overflow-hidden transition-all">
                  {channel?.avatar ? (
                    <img src={channel.avatar} alt={channel.handle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-xl text-zinc-400 group-hover:text-white transition-colors">
                      {channel?.displayName.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-zinc-100 text-lg uppercase leading-tight group-hover:text-lime-400 transition-colors">
                    {channel?.displayName || 'Unknown Channel'}
                  </h3>
                  <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mt-1">
                    {channel?.subscribers.length || 0} Subs
                  </p>
                </div>
              </div>

              {!isMe && channel && (
                 <button 
                  onClick={handleSub}
                  className={`px-6 py-3 font-display font-bold text-xs uppercase tracking-widest transition-all rounded-full ${
                    isSubscribed 
                      ? 'border border-zinc-700 text-zinc-400 hover:border-lime-400 hover:text-lime-400' 
                      : 'bg-lime-400 text-lime-950 hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>

            {localMeta.hashtags && localMeta.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {localMeta.hashtags.map(tag => (
                  <span key={tag} className="text-lime-400 font-bold uppercase tracking-widest text-xs px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-full flex items-center shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {localMeta.description && (
              <div className="prose prose-invert max-w-none text-zinc-300 font-medium leading-relaxed mb-12 border-l border-zinc-800 pl-6 bg-zinc-900/30 p-6 rounded-[2rem]">
                <p className="whitespace-pre-wrap">{localMeta.description}</p>
              </div>
            )}

            <Comments videoId={localMeta.id} />
          </div>
        </div>

        {/* Sidebar Recommended */}
        <div className="w-full md:w-96 lg:w-[400px] xl:w-[450px] shrink-0 border-l border-zinc-900 bg-zinc-950 p-6 overflow-y-auto">
          <h2 className="font-display text-xl font-bold uppercase tracking-widest text-zinc-100 mb-8 border-b border-zinc-900 pb-4">
            Up Next
          </h2>
          
          <div className="flex flex-col gap-6">
            {recommended.map(rec => (
              <div 
                key={rec.id} 
                className="flex gap-4 cursor-pointer group bg-zinc-900/20 p-2 rounded-[1.5rem] hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800"
                onClick={() => onVideoClick(rec)}
              >
                <div className="w-40 aspect-video bg-zinc-900 shrink-0 relative overflow-hidden rounded-[1rem] ring-1 ring-zinc-800 group-hover:ring-lime-400/50 transition-all">
                  <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
                  {rec.duration !== undefined && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase border border-zinc-800">
                      {formatDuration(rec.duration)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col py-1 min-w-0 flex-1">
                  <h3 className="font-display font-bold text-zinc-100 text-[13px] uppercase leading-tight group-hover:text-lime-400 line-clamp-2 mb-1 transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mt-auto">
                    {rec.views || 0} Views
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {showEditModal && (
        <EditVideoModal 
          video={localMeta}
          onClose={() => setShowEditModal(false)}
          onSave={(meta) => setLocalMeta(meta)}
        />
      )}
    </div>
  );
}
