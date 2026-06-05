import React, { useEffect, useState } from 'react';
import { Post, Channel } from '../types';
import { getPostsAll, getChannel, getChannels, likePost, getMyChannelId, deletePost } from '../db';
import { formatTimeAgo } from '../utils';
import { Heart, MessageSquare, Trash2 } from 'lucide-react';

export function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Record<string, Channel>>({});
  const [myId, setMyId] = useState('');

  const loadData = async () => {
    const all = await getPostsAll();
    const chs = await getChannels();
    const id = await getMyChannelId();
    
    setPosts(all);
    setMyId(id);
    
    const map: Record<string, Channel> = {};
    chs.forEach(c => map[c.id] = c);
    setChannels(map);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLike = async (id: string) => {
    await likePost(id, myId);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this transmission?")) {
      await deletePost(id);
      await loadData();
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 font-display font-bold uppercase tracking-widest text-xl h-full">
        No community transmissions yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 px-4 space-y-8 max-w-3xl mx-auto w-full">
      {posts.map(post => {
        const pChannel = channels[post.channelId];
        const isLiked = post.likes.includes(myId);
        return (
          <div key={post.id} className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 text-zinc-100 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                {pChannel?.avatar ? (
                  <img src={pChannel.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-display font-bold text-lime-400">
                    {pChannel?.displayName?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold uppercase">{pChannel?.displayName || 'Unknown'}</h3>
                <span className="text-xs text-zinc-500 font-bold tracking-widest">{formatTimeAgo(post.timestamp)}</span>
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap mb-6">{post.content}</p>

            {post.imageUrl && (
              <div className="w-full rounded-[1.5rem] overflow-hidden mb-6 bg-black border border-zinc-900">
                <img src={post.imageUrl} className="w-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
              <button 
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors ${isLiked ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-lime-400' : ''}`} />
                <span>{post.likes.length} Likes</span>
              </button>
              
              {post.channelId === myId && (
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
