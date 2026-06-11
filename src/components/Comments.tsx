import React, { useEffect, useState } from 'react';
import { Comment, Channel } from '../types';
import { getCommentsForVideo, getChannel, getMyChannelId, addComment, deleteComment, likeComment } from '../db';
import { formatTimeAgo } from '../utils';
import { ThumbsUp, ThumbsDown, MessageSquare, Trash2, Flag, CheckCircle2 } from 'lucide-react';

interface CommentsProps {
  videoId: string;
}

export function Comments({ videoId }: CommentsProps) {
  const [comments, setComments] = useState<{ c: Comment; ch: Channel | undefined }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyInput, setReplyInput] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    getMyChannelId().then(setMyId);
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    const list = await getCommentsForVideo(videoId);
    const enriched = await Promise.all(
      list.map(async c => {
        const ch = await getChannel(c.channelId);
        return { c, ch };
      })
    );
    setComments(enriched);
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;
    
    const comment: Comment = {
      id: crypto.randomUUID(),
      videoId,
      channelId: myId,
      text: text.trim(),
      timestamp: Date.now(),
      parentId,
      likes: []
    };
    await addComment(comment);
    
    if (parentId) {
      setReplyText('');
      setReplyInput(null);
    } else {
      setNewComment('');
    }
    loadComments();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this comment?")) {
      await deleteComment(id);
      loadComments();
    }
  };

  const handleLike = async (id: string) => {
    await likeComment(id, myId);
    loadComments();
  };

  const renderComment = ({ c, ch }: { c: Comment, ch: Channel | undefined }, isReply = false) => {
    const isLovedByMe = c.likes?.includes(myId);
    return (
      <div key={c.id} className={`flex gap-4 ${isReply ? 'mt-6' : ''}`}>
        <div className={`bg-zinc-800 shrink-0 rounded-full overflow-hidden flex items-center justify-center ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`}>
          {ch?.avatar ? (
            <img src={ch.avatar} alt={ch.handle} className="w-full h-full object-cover" />
          ) : (
            <span className={`font-display font-bold text-zinc-400 ${isReply ? 'text-xs' : ''}`}>
              {ch?.displayName.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display font-bold text-lime-400 flex items-center gap-1">
              {ch?.displayName || 'Unknown'}
              {ch && ch.subscribers.length > 2 && <CheckCircle2 className="w-3 h-3 text-lime-400" />}
            </span>
            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              {formatTimeAgo(c.timestamp)}
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed font-medium mb-2">
            {c.text}
          </p>
          <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-zinc-500">
            <button onClick={() => handleLike(c.id)} className={`flex items-center gap-1.5 transition-colors ${isLovedByMe ? 'text-lime-400' : 'hover:text-zinc-300'}`}>
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{c.likes?.length || 0}</span>
            </button>
            <button onClick={() => alert('Feedback recorded')} className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {!isReply && (
              <button onClick={() => setReplyInput(replyInput === c.id ? null : c.id)} className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
            {c.channelId === myId ? (
              <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 hover:text-red-400 transition-colors ml-auto">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : (
              <button onClick={() => alert('Comment reported')} className="flex items-center gap-1.5 hover:text-orange-400 transition-colors ml-auto">
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            )}
          </div>
          
          {replyInput === c.id && !isReply && (
            <form onSubmit={(e) => handleSubmit(e, c.id)} className="flex gap-4 mt-6">
              <input 
                type="text" 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2 text-zinc-100 focus:outline-none focus:border-lime-400 transition-colors uppercase text-xs tracking-wider font-medium placeholder-zinc-600"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!replyText.trim()}
                className="uppercase tracking-widest text-xs font-bold bg-lime-400 text-lime-950 rounded-full px-6 py-2 hover:bg-lime-500 hover:shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all disabled:opacity-50"
              >
                Reply
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 border-t border-zinc-900 pt-8">
      <h3 className="font-display text-2xl font-bold mb-8 uppercase tracking-widest text-zinc-100">
        Comments <span className="text-zinc-500 ml-2">{comments.length}</span>
      </h3>
      
      <form onSubmit={e => handleSubmit(e)} className="flex gap-4 mb-12">
        <input 
          type="text" 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="ADD A COMMENT..."
          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] px-6 py-3 text-zinc-100 focus:outline-none focus:border-lime-400 transition-colors uppercase text-sm tracking-wider font-medium placeholder-zinc-600"
        />
        <button 
          type="submit"
          disabled={!newComment.trim()}
          className="uppercase tracking-widest text-sm font-bold bg-lime-400 text-lime-950 rounded-full px-8 py-3 hover:bg-lime-500 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all disabled:opacity-50"
        >
          Post
        </button>
      </form>

      <div className="space-y-8">
        {comments.filter(c => !c.c.parentId).map(mainCmd => (
          <div key={mainCmd.c.id}>
            {renderComment(mainCmd, false)}
            <div className="pl-14 border-l-2 border-zinc-900 ml-5 mt-2">
              {comments.filter(c => c.c.parentId === mainCmd.c.id)
                       .sort((a,b) => a.c.timestamp - b.c.timestamp)
                       .map(replyCmd => renderComment(replyCmd, true))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
