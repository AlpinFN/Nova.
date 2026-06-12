import React, { useEffect, useState, useRef } from 'react';
import { getChatThreads, createChatThread, getMessagesForChat, sendDirectMessage, getChannels, getMyChannelId, blockUser, unblockUser } from '../db';
import { ChatThread, DirectMessage, Channel } from '../types';
import { ArrowLeft, Plus, Users, Send, Ban, CheckCircle2 } from 'lucide-react';
import { formatTimeAgo } from '../utils';

interface ChatsViewProps {
  onBack: () => void;
  onChannelClick: (channelId: string) => void;
  initialUserId?: string;
}

export function ChatsView({ onBack, onChannelClick, initialUserId }: ChatsViewProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [channels, setChannels] = useState<Record<string, Channel>>({});
  const [myId, setMyId] = useState('');
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [myChannel, setMyChannel] = useState<Channel | null>(null);

  const [messageInput, setMessageInput] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBaseData();
    const interval = setInterval(loadThreads, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadBaseData = async () => {
    const id = await getMyChannelId();
    setMyId(id);
    const chs = await getChannels();
    const map: Record<string, Channel> = {};
    chs.forEach(c => map[c.id] = c);
    setChannels(map);
    setMyChannel(map[id]);
    const loadedThreads = await loadThreads();

    if (initialUserId && initialUserId !== id && !activeThread) {
      // Find existing
      const existing = loadedThreads.find(t => !t.isGroup && t.participantIds.includes(initialUserId) && t.participantIds.includes(id));
      if (existing) {
        setActiveThread(existing);
      } else {
        // Create new
        const thread = await createChatThread([id, initialUserId], false);
        setActiveThread(thread);
        await loadThreads();
      }
    }
  };

  const loadThreads = async () => {
    const all = await getChatThreads();
    const myId = await getMyChannelId();
    // Fetch only threads I'm in
    const mine = all.filter(t => t.participantIds.includes(myId)).sort((a,b) => b.updatedAt - a.updatedAt);
    setThreads(mine);
    
    // Refresh channels in case of name change / block list update
    const chs = await getChannels();
    const map: Record<string, Channel> = {};
    chs.forEach(c => map[c.id] = c);
    setChannels(map);
    setMyChannel(map[myId]);

    return mine;
  };

  useEffect(() => {
    if (activeThread) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeThread]);

  const loadMessages = async () => {
    if (!activeThread) return;
    const msgs = await getMessagesForChat(activeThread.id);
    setMessages(msgs);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThread) return;
    await sendDirectMessage(activeThread.id, myId, messageInput.trim());
    setMessageInput('');
    await loadMessages();
    await loadThreads();
  };

  const startNewChat = async () => {
    if (selectedParticipants.length === 0) return;
    const ids = [myId, ...selectedParticipants];
    
    // Check if 1on1 already exists
    if (!isGroup && ids.length === 2) {
      const existing = threads.find(t => !t.isGroup && t.participantIds.includes(ids[0]) && t.participantIds.includes(ids[1]));
      if (existing) {
        setActiveThread(existing);
        setShowNewChat(false);
        return;
      }
    }

    const thread = await createChatThread(ids, isGroup, isGroup ? groupName : undefined);
    setActiveThread(thread);
    setShowNewChat(false);
    setSelectedParticipants([]);
    setGroupName('');
    setIsGroup(false);
    await loadThreads();
  };

  const getThreadName = (t: ChatThread) => {
    if (t.isGroup) return t.name || 'Unnamed Group';
    const otherId = t.participantIds.find(id => id !== myId);
    return channels[otherId || '']?.displayName || 'Unknown';
  };

  const getThreadAvatar = (t: ChatThread) => {
    if (t.isGroup) return null; // Can render a group icon instead
    const otherId = t.participantIds.find(id => id !== myId);
    return channels[otherId || '']?.avatar;
  };

  const otherParticipantId = activeThread && !activeThread.isGroup ? activeThread.participantIds.find(id => id !== myId) : null;
  const isBlockedActiveUser = otherParticipantId && myChannel?.blockedUserIds?.includes(otherParticipantId);
  const amIBlocked = otherParticipantId && channels[otherParticipantId]?.blockedUserIds?.includes(myId);

  const toggleBlockStatus = async () => {
    if (!otherParticipantId) return;
    if (isBlockedActiveUser) {
      await unblockUser(myId, otherParticipantId);
    } else {
      await blockUser(myId, otherParticipantId);
    }
    await loadBaseData(); // Refresh block lists
  };

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden relative border-t border-zinc-900 border-x-0 w-full">
      {/* Sidebar Threads List */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 border-r border-zinc-900 bg-zinc-950 flex flex-col h-full z-10 hidden md:flex">
        <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-widest text-zinc-100">
            Comms
          </h2>
          <button onClick={() => setShowNewChat(true)} className="p-2 bg-lime-400 text-lime-950 rounded-full hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
           {threads.length === 0 && (
             <div className="p-6 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest mt-10">
               No active channels.
             </div>
           )}
           {threads.map(t => (
             <div 
               key={t.id} 
               onClick={() => setActiveThread(t)}
               className={`flex items-center gap-4 p-4 border-b border-zinc-900 cursor-pointer hover:bg-zinc-900 transition-colors ${activeThread?.id === t.id ? 'bg-zinc-900 border-l-2 border-l-lime-400' : ''}`}
             >
               <div className="w-12 h-12 bg-zinc-800 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-zinc-700">
                 {getThreadAvatar(t) ? (
                   <img src={getThreadAvatar(t)!} className="w-full h-full object-cover" />
                 ) : t.isGroup ? (
                   <Users className="w-5 h-5 text-lime-400" />
                 ) : (
                   <span className="font-display font-bold text-lime-400">{getThreadName(t).charAt(0)}</span>
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="font-display font-bold text-zinc-100 truncate text-sm">{getThreadName(t)}</h4>
                 <p className="text-xs text-zinc-500 truncate mt-1">
                   {t.updatedAt > 0 ? formatTimeAgo(t.updatedAt) : 'New Transmission'}
                 </p>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black relative">
        {showNewChat ? (
          <div className="p-8 max-w-2xl mx-auto w-full flex flex-col gap-6">
             <div className="flex items-center gap-4 mb-6">
                <button onClick={() => {setShowNewChat(false); setSelectedParticipants([]);}} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-white">New Transmission</h2>
             </div>

             <div className="flex items-center gap-4 mb-4">
               <button onClick={() => setIsGroup(false)} className={`flex-1 py-3 font-bold uppercase tracking-widest text-xs rounded-full border border-zinc-800 transition-colors ${!isGroup ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>Direct</button>
               <button onClick={() => setIsGroup(true)} className={`flex-1 py-3 font-bold uppercase tracking-widest text-xs rounded-full border border-zinc-800 transition-colors ${isGroup ? 'bg-lime-400 text-lime-950 border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>Group</button>
             </div>

             {isGroup && (
                <input 
                  type="text" 
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Group Name..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-lime-400 mb-4 placeholder-zinc-600"
                />
             )}

             <input 
               type="text" 
               value={newChatQuery}
               onChange={e => setNewChatQuery(e.target.value)}
               placeholder="Search identifiers..."
               className="w-full bg-zinc-950 border border-zinc-800 rounded-full px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-lime-400 mb-4 placeholder-zinc-600 shadow-inner"
             />

             <div className="flex-1 overflow-y-auto max-h-96 pr-2">
                {(Object.values(channels) as Channel[])
                  .filter(c => c.id !== myId)
                  .filter(c => !newChatQuery || c.displayName.toLowerCase().includes(newChatQuery.toLowerCase()) || c.handle.toLowerCase().includes(newChatQuery.toLowerCase()))
                  .map(c => {
                    const isSelected = selectedParticipants.includes(c.id);
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          if (isSelected) {
                            setSelectedParticipants(p => p.filter(id => id !== c.id));
                          } else {
                            if (!isGroup) setSelectedParticipants([c.id]);
                            else setSelectedParticipants(p => [...p, c.id]);
                          }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-colors border ${isSelected ? 'border-lime-400 bg-lime-400/10' : 'border-zinc-900 bg-zinc-900/40 hover:border-zinc-700'}`}
                      >
                        <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                          {c.avatar ? <img src={c.avatar} className="w-full object-cover h-full" /> : <div className="w-full h-full flex items-center justify-center font-bold text-lime-400">{c.displayName.charAt(0)}</div>}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm">{c.displayName}</h4>
                          <span className="text-zinc-500 text-xs tracking-widest">{c.handle}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-lime-400" />}
                      </div>
                    )
                  })}
             </div>

             <button 
               onClick={startNewChat}
               disabled={selectedParticipants.length === 0 || (isGroup && !groupName.trim())}
               className="w-full py-4 mt-auto bg-lime-400 text-lime-950 rounded-full font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-lime-500 transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
             >
               Initialize Channel
             </button>
          </div>
        ) : !activeThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Users className="w-16 h-16 opacity-20" />
            <span className="font-display font-bold uppercase tracking-widest text-lg">Select a transmission</span>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Chat Header */}
            <div className="px-6 h-20 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveThread(null)} className="md:hidden p-2 text-zinc-400">
                  <ArrowLeft className="w-5 h-5"/>
                </button>
                <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                   {getThreadAvatar(activeThread) ? (
                     <img src={getThreadAvatar(activeThread)!} className="w-full h-full object-cover" />
                   ) : activeThread.isGroup ? (
                     <Users className="w-4 h-4 text-lime-400" />
                   ) : (
                     <span className="font-display font-bold text-lime-400">{getThreadName(activeThread).charAt(0)}</span>
                   )}
                 </div>
                 <div>
                   <h3 className="font-display font-bold uppercase tracking-widest text-white text-sm">
                     {getThreadName(activeThread)}
                   </h3>
                   {!activeThread.isGroup && otherParticipantId && (
                     <span 
                       onClick={() => onChannelClick(otherParticipantId)}
                       className="text-xs text-lime-400 cursor-pointer hover:underline"
                     >
                       View Profile
                     </span>
                   )}
                 </div>
              </div>

              {!activeThread.isGroup && (
                <button 
                  onClick={toggleBlockStatus}
                  className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 uppercase tracking-widest font-bold text-xs ${isBlockedActiveUser ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-500'}`}
                  title={isBlockedActiveUser ? 'Unblock user' : 'Block user'}
                >
                  <Ban className="w-4 h-4" />
                  {isBlockedActiveUser ? 'Blocked' : 'Block'}
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {messages.length === 0 ? (
                <div className="text-center my-auto text-zinc-600 font-bold uppercase tracking-widest text-xs">
                  Begin transmission.
                </div>
              ) : (
                messages.map(m => {
                  const isMe = m.senderId === myId;
                  const sender = channels[m.senderId];
                  return (
                    <div key={m.id} className={`flex max-w-[80%] ${isMe ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && activeThread.isGroup && (
                           <span className="text-[10px] text-zinc-500 font-bold tracking-widest ml-4">{sender?.displayName}</span>
                        )}
                        <div className={`px-6 py-4 rounded-[1.5rem] ${isMe ? 'bg-lime-400 text-lime-950 font-medium shadow-[0_0_15px_rgba(163,230,53,0.15)] rounded-tr-sm' : 'bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-sm'}`}>
                          {m.text}
                        </div>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2 mt-1">
                          {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
               {isBlockedActiveUser ? (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-center text-xs font-bold uppercase tracking-widest">
                   You have blocked this connection.
                 </div>
               ) : amIBlocked ? (
                 <div className="p-4 bg-zinc-900/50 border border-zinc-800 text-zinc-500 rounded-full text-center text-xs font-bold uppercase tracking-widest">
                   You cannot reply to this conversation.
                 </div>
               ) : (
                 <form onSubmit={handleSendMessage} className="flex gap-2">
                   <input 
                     type="text"
                     value={messageInput}
                     onChange={e => setMessageInput(e.target.value)}
                     placeholder="Message..."
                     className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-6 py-4 text-sm font-medium text-white focus:outline-none focus:border-lime-400 transition-colors placeholder-zinc-600"
                   />
                   <button 
                     type="submit"
                     disabled={!messageInput.trim()}
                     className="w-14 h-14 bg-lime-400 text-lime-950 border border-lime-400 rounded-full flex items-center justify-center hover:bg-lime-500 disabled:opacity-50 transition-colors shrink-0 shadow-[0_0_15px_rgba(163,230,53,0.2)]"
                   >
                     <Send className="w-5 h-5 ml-1" />
                   </button>
                 </form>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
