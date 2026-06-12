import React, { useEffect, useState } from 'react';
import { Channel, VideoMeta } from '../types';
import { getChannel, getChannels, getVideosMeta, toggleSubscribe, getMyChannelId } from '../db';
import { Settings, MessageSquare, CheckCircle2, MoreVertical, Link, Ban } from 'lucide-react';
import { formatTimeAgo, formatDuration } from '../utils';

interface ChannelViewProps {
  channelId: string;
  onVideoClick: (video: VideoMeta) => void;
  onEditClick: () => void;
  onLiveClick: (channelId: string) => void;
  onMessageClick?: (channelId: string) => void;
}

export function ChannelView({ channelId, onVideoClick, onEditClick, onLiveClick, onMessageClick }: ChannelViewProps) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [myId, setMyId] = useState('');
  const [channelNumber, setChannelNumber] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [channelId]);

  const loadData = async () => {
    const ch = await getChannel(channelId);
    setChannel(ch || null);
    
    if (ch) {
      const allChannels = await getChannels();
      const sortedChannels = allChannels.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      const idx = sortedChannels.findIndex(idxCh => idxCh.id === ch.id);
      if (idx !== -1) {
        setChannelNumber(idx + 1);
      }
    }
    
    const allVids = await getVideosMeta();
    setVideos(allVids.filter(v => v.channelId === channelId));
    
    const my = await getMyChannelId();
    setMyId(my);
  };

  const handleSubscribe = async () => {
    if (!channel) return;
    await toggleSubscribe(channel.id, myId);
    loadData();
  };

  if (!channel) return <div className="p-8 text-white">Loading...</div>;

  const isMe = channel.id === myId;
  const isSubscribed = channel.subscribers.includes(myId);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950">
      {/* Banner */}
      <div className="h-48 md:h-64 lg:h-80 w-full bg-zinc-900 border-b border-zinc-800">
        {channel.banner && (
          <img src={channel.banner} alt="Banner" className="w-full h-full object-cover opacity-50" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-8 -mt-16 md:-mt-20 mb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-zinc-950 shrink-0 flex items-center justify-center relative rounded-full p-2">
            <div className="absolute inset-2 bg-zinc-800 rounded-full overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              {channel.avatar ? (
                <img src={channel.avatar} alt={channel.handle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lime-400">
                  <span className="font-display font-bold text-5xl">
                    {channel.displayName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-zinc-100 uppercase tracking-tighter mb-2 flex items-center gap-4">
                {channel.displayName}
                {channel.subscribers.length > 1 && (
                  <CheckCircle2 className="w-8 h-8 text-lime-400" />
                )}
                {channel.isLive && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-500 text-xs tracking-widest font-bold uppercase rounded-full border border-red-500/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-4 text-sm font-semibold tracking-widest text-zinc-400 uppercase flex-wrap mt-2">
                <span className="text-lime-400">{channel.handle}</span>
                <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                <span>{channel.subscribers.length} Subscribers</span>
                <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                <span>{videos.length} Videos</span>
                {channelNumber !== null && (
                  <>
                    <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                    <span className="text-amber-400 flex items-center gap-1">
                      #{channelNumber} Channel
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                 <button onClick={() => {
                   navigator.clipboard.writeText(window.location.origin + "/#channel=" + channel.id);
                   alert("Profile link copied!");
                 }} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-100"><Link className="w-5 h-5"/></button>
                 {!isMe && <button onClick={() => alert("User blocked.")} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-zinc-100"><Ban className="w-5 h-5"/></button>}
              </div>
              {isMe ? (
                <button 
                  onClick={onEditClick}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 font-display font-bold text-sm uppercase tracking-widest text-zinc-100 transition-colors rounded-full"
                >
                  <Settings className="w-4 h-4" />
                  Customize Focus
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      if (onMessageClick) onMessageClick(channel.id);
                    }}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all rounded-full flex items-center justify-center border border-zinc-800 hover:border-zinc-700"
                    title="Send a message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  {channel.isLive && (
                    <button 
                      onClick={() => onLiveClick(channel.id)}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-display font-bold text-sm uppercase tracking-widest transition-all rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Watch Live
                    </button>
                  )}
                  <button 
                    onClick={handleSubscribe}
                    className={`px-8 py-3 font-display font-bold text-sm uppercase tracking-widest transition-all rounded-full ${
                      isSubscribed 
                        ? 'border border-zinc-700 text-zinc-300 hover:border-lime-400 hover:text-lime-400' 
                        : 'bg-lime-400 text-lime-950 hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                    }`}
                  >
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {channel.bio && (
          <div className="mb-16 max-w-3xl bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50">
            <p className="text-zinc-300 leading-relaxed font-medium text-lg">
              {channel.bio}
            </p>
          </div>
        )}

        <hr className="border-zinc-900 mb-12" />

        <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-zinc-100 mb-8">
          Uploads
        </h2>

        {/* Video Grid - Soft UI style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {videos.map(video => (
            <div 
              key={video.id} 
              className="group cursor-pointer flex flex-col gap-4 bg-zinc-900/20 p-2 rounded-[1.5rem] hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800"
              onClick={() => onVideoClick(video)}
            >
              <div className="relative aspect-video bg-zinc-900 overflow-hidden rounded-[1rem] ring-1 ring-zinc-800 group-hover:ring-lime-400/50 transition-all">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${video.isShort ? 'object-contain' : 'object-cover'}`}
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
              
              <div className="flex flex-col px-2 pb-2">
                <h3 className="font-display font-bold text-zinc-100 text-[15px] leading-tight group-hover:text-lime-400 transition-colors uppercase line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                  <span>{video.views} Views</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span>{formatTimeAgo(video.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-12 text-zinc-500 font-display font-bold uppercase tracking-widest">
              No videos uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
