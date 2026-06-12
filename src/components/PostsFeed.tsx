import React, { useEffect, useState } from 'react';
import { Post, Channel } from '../types';
import { getPostsAll, getChannel, getChannels, likePost, getMyChannelId, deletePost, replyToPost } from '../db';
import { formatTimeAgo } from '../utils';
import { Heart, MessageSquare, Trash2, Send, Share2, MoreHorizontal, CheckCircle2, Bookmark, Flag } from 'lucide-react';

function PostItem({ 
  post, 
  channels, 
  myId, 
  isExpanded, 
  setExpandedId, 
  handleLike, 
  handleDelete, 
  handleReply, 
  replyText, 
  setReplyText 
}: any) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(post.imageUrl);

  useEffect(() => {
    if (post.imageUrl && post.imageUrl.startsWith('/local_post/')) {
      import('../db').then(({ getPostImage }) => {
        getPostImage(post.id).then(img => {
          if (img) setImageUrl(img);
        });
      });
    } else {
      setImageUrl(post.imageUrl);
    }
  }, [post]);

  const pChannel = channels[post.channelId];
  const isLiked = post.likes.includes(myId);
  const replies = post.replies || [];

  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 text-zinc-100 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
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
            <h3 className="font-display font-bold uppercase flex items-center gap-2">
              {pChannel?.displayName || 'Unknown'}
              {pChannel?.subscribers?.length > 2 && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
            </h3>
            <span className="text-xs text-zinc-500 font-bold tracking-widest">{formatTimeAgo(post.timestamp)}</span>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-all"><Bookmark className="w-4 h-4" /></button>
          <button className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-all"><Share2 className="w-4 h-4" /></button>
          <button className="p-2 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-zinc-800 transition-all"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>

      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap mb-6">{post.content}</p>

      {imageUrl && (
        <div className="w-full rounded-[1.5rem] overflow-hidden mb-6 bg-black border border-zinc-900">
          <img src={imageUrl} className="w-full object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => handleLike(post.id)}
            className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors ${isLiked ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-lime-400' : ''}`} />
            <span>{post.likes.length} Likes</span>
          </button>
          <button 
            onClick={() => setExpandedId(isExpanded ? null : post.id)}
            className={`flex items-center gap-2 font-bold text-xs uppercase tracking-widest transition-colors ${isExpanded ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>{replies.length} Replies</span>
          </button>
        </div>
        
        <div className="flex gap-4">
           <button className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest text-zinc-500 hover:text-orange-400 transition-colors">
              <Flag className="w-4 h-4" />
              Report
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
      
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4">
           {replies.map((r: any) => {
             const rCh = channels[r.channelId];
             return (
               <div key={r.id} className="flex gap-3 text-sm flex-col md:flex-row">
                 <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden hidden md:block">
                   {rCh?.avatar ? <img src={rCh.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex justify-center items-center font-bold text-xs">{rCh?.displayName?.charAt(0)}</div>}
                 </div>
                 <div className="bg-zinc-800/40 p-3 rounded-2xl md:rounded-tl-none flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <div className="font-bold flex items-center gap-1">
                          {rCh?.displayName || 'Unknown'}
                          {rCh?.subscribers?.length > 2 && <CheckCircle2 className="w-3 h-3 text-lime-400" />}
                       </div>
                       <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 flex shrink-0 ml-2">{formatTimeAgo(r.timestamp)}</span>
                    </div>
                    <p className="text-zinc-300">{r.text}</p>
                 </div>
               </div>
             );
           })}
           
           <div className="flex gap-2 pt-2">
             <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full flex items-center px-4">
               <input 
                 type="text" 
                 placeholder="Add a reply... (Emojis supported 🙌)"
                 className="bg-transparent w-full focus:outline-none text-sm py-3 text-zinc-100 placeholder-zinc-500"
                 value={replyText[post.id] || ''}
                 onChange={e => setReplyText((prev: any) => ({ ...prev, [post.id]: e.target.value }))}
                 onKeyDown={e => {
                   if (e.key === 'Enter') handleReply(post.id);
                 }}
               />
             </div>
             <button 
               onClick={() => handleReply(post.id)}
               disabled={!(replyText[post.id] || '').trim()}
               className="bg-lime-400 text-lime-950 p-3 rounded-full hover:bg-lime-500 transition-colors disabled:opacity-50"
             >
               <Send className="w-5 h-5" />
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

export function PostsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<Record<string, Channel>>({});
  const [myId, setMyId] = useState('');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleReply = async (postId: string) => {
    const text = replyText[postId];
    if (!text || !text.trim()) return;
    await replyToPost(postId, {
      id: crypto.randomUUID(),
      channelId: myId,
      text: text.trim(),
      timestamp: Date.now()
    });
    setReplyText(prev => ({ ...prev, [postId]: '' }));
    await loadData();
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
      {posts.map(post => (
        <PostItem 
          key={post.id}
          post={post}
          channels={channels}
          myId={myId}
          isExpanded={expandedId === post.id}
          setExpandedId={setExpandedId}
          handleLike={handleLike}
          handleDelete={handleDelete}
          handleReply={handleReply}
          replyText={replyText}
          setReplyText={setReplyText}
        />
      ))}
    </div>
  );
}
