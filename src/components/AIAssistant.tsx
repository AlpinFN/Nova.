import React, { useState } from 'react';
import { Hash, Search, ArrowRight } from 'lucide-react';
import { VideoMeta } from '../types';
import { formatTimeAgo } from '../utils';
import { useLanguage } from '../LanguageContext';

interface TagSearchProps {
  videos: VideoMeta[];
  onVideoClick: (video: VideoMeta) => void;
}

export function AIAssistant({ videos, onVideoClick }: TagSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoMeta[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { t } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || videos.length === 0) return;

    setHasSearched(true);
    const searchTerms = query.toLowerCase().split(/\s+/).map(t => t.replace(/^#/, ''));
    
    const matched = videos.filter(v => {
      const hashtags = (v.hashtags || []).map(h => h.toLowerCase().replace(/^#/, ''));
      const textScope = (v.title + " " + v.description).toLowerCase();
      // Match if any search term is part of a hashtag or the text
      return searchTerms.some(term => 
        hashtags.includes(term) || textScope.includes(term)
      );
    });
    
    setResults(matched);
  };

  return (
    <div className="flex-1 flex flex-col items-center overflow-y-auto p-6 bg-zinc-950 w-full relative h-[100dvh]">
      <div className="w-full max-w-2xl bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden mt-10">
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
          <Hash className="w-64 h-64 text-lime-400" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-lime-400/20 border-2 border-lime-400/50 rounded-full flex items-center justify-center text-lime-400 mb-6 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="font-display text-4xl font-bold uppercase tracking-tighter text-white mb-2">{t('Tag Search')}</h2>
          <p className="text-zinc-400 font-sans text-sm tracking-widest uppercase mb-10 max-w-md">
            Query the archive by typing hashtags or keywords.
          </p>

          <form onSubmit={handleSearch} className="w-full relative flex items-center">
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="#gaming #tutorial" 
              className="w-full bg-black border-2 border-zinc-800 rounded-full pl-6 pr-16 py-4 text-sm font-bold tracking-widest text-white focus:outline-none focus:border-lime-400 focus:bg-zinc-950 transition-all placeholder-zinc-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
            />
            <button 
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2 p-3 bg-lime-400 text-lime-950 rounded-full disabled:opacity-50 hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {hasSearched && (
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
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover relative z-[2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-white text-sm truncate group-hover:text-lime-400 transition-colors">
                      {video.title}
                    </h4>
                    <div className="flex flex-wrap gap-2 py-1">
                      {(video.hashtags || []).map(h => (
                        <span key={h} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{h}</span>
                      ))}
                    </div>
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
