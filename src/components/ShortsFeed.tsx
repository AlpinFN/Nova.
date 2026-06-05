import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, Heart, MessageSquare, Share2 } from "lucide-react";
import { formatTimeAgo, formatViews } from "../utils";
import { getVideoFile, getChannel } from "../db";
import { VideoMeta, Channel } from "../types";

interface ShortsFeedProps {
  videos: VideoMeta[];
  onBack: () => void;
  onVideoClick: (video: VideoMeta) => void;
  onChannelClick: (channelId: string) => void;
}

export function ShortsFeed({ videos, onBack, onVideoClick, onChannelClick }: ShortsFeedProps) {
  const shorts = videos.filter(v => v.isShort);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (shorts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/50 overflow-hidden relative">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-50 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 px-6 py-3 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Return
        </button>
        <div className="text-zinc-500 font-display font-bold uppercase tracking-widest text-xl">
          No Short Transmissions found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-50 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 px-6 py-3 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        Return
      </button>

      <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll" style={{ scrollbarWidth: 'none' }}>
        {shorts.map((video, index) => (
          <ShortPlayer 
            key={video.id} 
            video={video} 
            isActive={index === currentIndex} 
            onVisible={() => setCurrentIndex(index)}
            onChannelClick={onChannelClick}
            onVideoClick={() => onVideoClick(video)}
          />
        ))}
      </div>
    </div>
  );
}

function ShortPlayer({ video, isActive, onVisible, onChannelClick, onVideoClick }: { video: VideoMeta, isActive: boolean, onVisible: () => void, onChannelClick: (id: string) => void, onVideoClick: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    let url = '';
    getVideoFile(video.id).then(file => {
      if (file) {
        url = URL.createObjectURL(file);
        setVideoUrl(url);
      }
    });
    getChannel(video.channelId).then(ch => {
      if (ch) setChannel(ch);
    });

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [video]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
        }
      },
      { threshold: 0.6 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={containerRef} className="h-full w-full max-w-lg mx-auto snap-center flex justify-center relative bg-black border-x border-zinc-900 border-opacity-50 group">
      {videoUrl ? (
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover cursor-pointer"
          loop
          playsInline
          controls
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full h-full object-cover flex items-center justify-center bg-zinc-900 text-zinc-600 font-display font-bold uppercase uppercase tracking-widest text-xs">
          Loading Feed...
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 top-auto p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end">
        <div className="flex-1 pr-16 max-w-sm">
          <div 
            onClick={() => channel && onChannelClick(channel.id)}
            className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-lime-400 overflow-hidden shrink-0 flex items-center justify-center">
              {channel?.avatar ? (
                <img src={channel.avatar} alt={channel.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-lime-400 text-sm">
                  {channel?.displayName?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-base text-zinc-100">{channel?.displayName}</h3>
          </div>
          <p className="text-zinc-100 font-bold mb-2 break-words leading-snug drop-shadow-md">
            {video.title}
          </p>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center">
        <button className="flex flex-col items-center gap-1 text-zinc-100 hover:text-lime-400 transition-colors drop-shadow-md group/btn">
          <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm group-hover/btn:bg-zinc-800 group-hover/btn:shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all">
            <Heart className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold">{formatViews(video.likes?.length || 0)}</span>
        </button>
        <button onClick={onVideoClick} className="flex flex-col items-center gap-1 text-zinc-100 hover:text-lime-400 transition-colors drop-shadow-md group/btn">
           <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm group-hover/btn:bg-zinc-800 group-hover/btn:shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all">
            <MessageSquare className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[10px]">Open</span>
        </button>
      </div>
    </div>
  );
}
