import React, { useEffect, useState } from 'react';
import { getHistory, getVideosMeta, clearHistory } from '../db';
import { HistoryItem, VideoMeta } from '../types';
import { formatTimeAgo, formatDuration } from '../utils';
import { Trash2 } from 'lucide-react';

interface HistoryViewProps {
  onVideoClick: (video: VideoMeta) => void;
}

export function HistoryView({ onVideoClick }: HistoryViewProps) {
  const [historyItems, setHistoryItems] = useState<(HistoryItem & { video?: VideoMeta })[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const items = await getHistory();
    const metas = await getVideosMeta();
    
    const enriched = items.map(item => {
      const v = metas.find(m => m.id === item.videoId);
      return { ...item, video: v };
    }).filter(i => i.video) as (HistoryItem & { video: VideoMeta })[];
    
    setHistoryItems(enriched);
  };

  const handleClear = async () => {
    if (confirm("Clear all watch history?")) {
      await clearHistory();
      setHistoryItems([]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 pb-32">
      <div className="flex items-end justify-between border-b border-zinc-900 pb-8 mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-white">Watch History</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-2">Recent Transmissions</p>
        </div>
        <button 
          onClick={handleClear}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Log
        </button>
      </div>

      {historyItems.length === 0 ? (
        <div className="text-center p-12 text-zinc-500 font-bold uppercase tracking-widest">
          No records found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {historyItems.map(item => (
            <div 
              key={item.id}
              onClick={() => onVideoClick(item.video!)}
              className="flex gap-6 p-4 rounded-[1.5rem] bg-zinc-900/20 hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800 cursor-pointer group"
            >
              <div className="w-48 aspect-video bg-zinc-900 rounded-[1rem] overflow-hidden relative shrink-0">
                {item.video.thumbnail ? (
                  <img src={item.video.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : null}
                {item.video.duration && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[10px] font-bold text-white uppercase border border-zinc-800">
                    {formatDuration(item.video.duration)}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 py-2">
                <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white group-hover:text-lime-400 transition-colors">
                  {item.video.title}
                </h2>
                <div className="flex items-center gap-4 mt-auto mb-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                  <span>{(item.video.views || 0)} Views</span>
                  <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                  <span>{formatTimeAgo(item.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
