import React, { useState } from 'react';
import { Bot, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { VideoMeta } from '../types';
import { formatTimeAgo } from '../utils';

interface AIAssistantProps {
  videos: VideoMeta[];
  onVideoClick: (video: VideoMeta) => void;
}

export function AIAssistant({ videos, onVideoClick }: AIAssistantProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || videos.length === 0) return;

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const res = await fetch('/api/recommend-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, videos })
      });
      const ids = await res.json();
      setRecommendedIds(ids || []);
    } catch (err) {
      console.error(err);
      setRecommendedIds([]);
    } finally {
      setIsSearching(false);
    }
  };

  const results = videos.filter(v => recommendedIds.includes(v.id));

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-2xl bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
          <Bot className="w-64 h-64 text-lime-400" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-lime-400/20 border-2 border-lime-400/50 rounded-full flex items-center justify-center text-lime-400 mb-6 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-display text-4xl font-bold uppercase tracking-tighter text-white mb-2">AI Core</h2>
          <p className="text-zinc-400 font-sans text-sm tracking-widest uppercase mb-10 max-w-md">
            Query the central intelligence. Describe what you're looking for, and it will find the perfect transmission.
          </p>

          <form onSubmit={handleAskAI} className="w-full relative flex items-center">
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="E.g. I want to watch something about gaming..." 
              className="w-full bg-black border-2 border-zinc-800 rounded-full pl-6 pr-16 py-4 text-sm font-bold tracking-widest text-white focus:outline-none focus:border-lime-400 focus:bg-zinc-950 transition-all placeholder-zinc-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
            />
            <button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 p-3 bg-lime-400 text-lime-950 rounded-full disabled:opacity-50 hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        {hasSearched && !isSearching && (
          <div className="mt-12 w-full z-10 relative">
            <h3 className="font-display text-xl font-bold uppercase tracking-widest text-zinc-100 mb-6 border-b border-zinc-800 pb-4">
              {results.length > 0 ? 'Matched Resonances' : 'No Resonances Found'}
            </h3>
            <div className="flex flex-col gap-4">
              {results.map(video => (
                <div 
                  key={video.id} 
                  onClick={() => onVideoClick(video)}
                  className="flex items-center gap-6 p-4 rounded-[1.5rem] bg-black/40 border border-zinc-800 hover:border-lime-400/50 hover:bg-zinc-900 transition-all cursor-pointer group"
                >
                  <div className="w-24 h-16 bg-zinc-800 rounded-[1rem] overflow-hidden shrink-0 ring-1 ring-zinc-700 group-hover:ring-lime-400">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-white text-sm truncate group-hover:text-lime-400 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest truncate mt-1">
                      {formatTimeAgo(video.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
