import { ArrowLeft, ArrowDown, Users, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getChannel, getMyChannelId, setChannelLiveStatus } from "../db";
import { Channel, ChatMessage } from "../types";
import { formatTimeAgo } from "../utils";
import { useLanguage } from "../LanguageContext";

interface LiveStreamProps {
  channelId: string;
  onBack: () => void;
  onMinimize?: () => void;
  onChannelClick: (channelId: string) => void;
}

export function LiveStream({ channelId, onBack, onMinimize, onChannelClick }: LiveStreamProps) {
  const { t } = useLanguage();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [myId, setMyId] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getChannel(channelId),
      getMyChannelId()
    ]).then(([ch, myChannelId]) => {
      if (mounted) {
        setChannel(ch || null);
        setMyId(myChannelId);
        if (ch?.isLive && ch.id !== myChannelId) {
           setIsLive(true); // Viewer sees stream has started (dummy visual for viewer)
        }
      }
    });

    const interval = setInterval(() => {
      // Dummy auto-refresh chat and channel status
      getChannel(channelId).then(ch => {
        if (mounted && ch) {
           setChannel(ch);
           if (ch.id !== myId) setIsLive(!!ch.isLive);
        }
      });
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
      stopWebcam();
      // Ensure we go offline when closing stream
      if (channelId === myId) {
        setChannelLiveStatus(myId, false);
      }
    };
  }, [channelId, myId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLive(true);
      await setChannelLiveStatus(myId, true);
    } catch (err) {
      console.error("Failed to start stream", err);
      alert("Could not access camera/microphone.");
    }
  };

  const stopStream = async () => {
    stopWebcam();
    setIsLive(false);
    await setChannelLiveStatus(myId, false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: myId,
      text: messageInput.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMsg]);
    setMessageInput('');
  };

  const isMe = channel?.id === myId;

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden relative">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar Navigation */}
          <div className="h-20 flex items-center px-6 shrink-0 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
            <button 
              onClick={onBack}
              className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 px-6 py-3 rounded-full shadow-sm hover:shadow-[0_0_15px_rgba(163,230,53,0.15)]"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('Return')}
            </button>
            {onMinimize && (
              <button 
                onClick={onMinimize}
                className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-lime-400 transition-colors bg-zinc-900 justify-center w-12 h-12 rounded-full shadow-sm hover:shadow-[0_0_15px_rgba(163,230,53,0.15)] md:hidden ml-2"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {isLive && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/20 text-red-500 font-bold uppercase tracking-widest text-xs rounded-full border border-red-500/50">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black flex flex-col justify-center border-b border-zinc-900 border-x-0 relative group">
            <div className="w-full max-w-6xl mx-auto aspect-video relative overflow-hidden bg-zinc-900">
              {isMe ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {!isLive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                      <h2 className="font-display font-bold text-2xl uppercase text-zinc-500 mb-6 tracking-widest">Transmit Stream</h2>
                      <button 
                        onClick={startStream}
                        className="bg-lime-400 text-lime-950 font-bold uppercase tracking-widest px-8 py-4 rounded-full hover:bg-lime-500 transition-all hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] shadow-[0_0_10px_rgba(163,230,53,0.2)]"
                      >
                        Start Streaming
                      </button>
                    </div>
                  )}
                </>
              ) : (
                isLive ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800">
                     <span className="text-lime-400 font-display font-bold uppercase tracking-widest animate-pulse">Receiving External Signal...</span>
                     {/* We use a mock pulsing view since real peer-to-peer needs WebRTC/servers */}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                     <span className="text-zinc-600 font-display font-bold uppercase tracking-widest">Stream Offline</span>
                  </div>
                )
              )}
            </div>
            
            {isMe && isLive && (
               <div className="absolute top-4 right-4 z-20">
                 <button 
                    onClick={stopStream}
                    className="bg-red-500 text-white font-bold uppercase tracking-widest text-xs px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    End Stream
                  </button>
               </div>
            )}
          </div>

          {/* Details */}
          <div className="w-full max-w-5xl mx-auto px-6 py-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-zinc-100 uppercase tracking-tighter mb-4 leading-none">
              {channel?.displayName}'s Live Session
            </h1>
          </div>
        </div>

        {/* Sidebar Live Chat */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 border-l border-zinc-900 bg-zinc-950 flex flex-col h-[50vh] md:h-auto">
          <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between shadow-sm">
            <h2 className="font-display text-lg font-bold uppercase tracking-widest text-zinc-100">
              Live Chat
            </h2>
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase">
              <Users className="w-4 h-4" />
              <span>{Math.floor(Math.random() * 50) + 1}</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-zinc-500 text-xs uppercase tracking-widest my-auto font-bold">
                Welcome to the live chat.
              </div>
            )}
            {chatMessages.map(msg => (
               <div key={msg.id} className="flex flex-col gap-1">
                 <div className="flex items-baseline gap-2">
                   <span className="font-bold text-[13px] text-lime-400">{msg.channelId === myId ? 'Me' : 'Viewer'}</span>
                   <span className="text-[10px] text-zinc-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                 </div>
                 <p className="text-sm text-zinc-200">{msg.text}</p>
               </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-zinc-900 bg-zinc-950">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input 
                type="text" 
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Send a message..." 
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-lime-400 focus:bg-zinc-800 transition-colors placeholder-zinc-600"
              />
              <button 
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 bg-lime-400 text-lime-950 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
