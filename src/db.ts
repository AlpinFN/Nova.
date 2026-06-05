import { get, set, del } from 'idb-keyval';
import { VideoMeta, Channel, Comment, Post, ChatThread, DirectMessage } from './types';

const META_KEY = 'nova_videos_meta';
const CHANNELS_KEY = 'nova_channels';
const COMMENTS_KEY = 'nova_comments';
const MY_ID_KEY = 'nova_my_channel_id';
const VERSION_KEY = 'nova_db_version';

const POSTS_KEY = 'nova_posts';

const CHATS_KEY = 'nova_chats';
const MESSAGES_KEY = 'nova_messages';

export async function getChatThreads(): Promise<ChatThread[]> {
  return (await get<ChatThread[]>(CHATS_KEY)) || [];
}

export async function createChatThread(participantIds: string[], isGroup: boolean = false, name?: string): Promise<ChatThread> {
  const threads = await getChatThreads();
  const id = crypto.randomUUID();
  const newThread: ChatThread = {
    id,
    isGroup,
    name,
    participantIds: participantIds.sort(),
    updatedAt: Date.now()
  };
  threads.push(newThread);
  await set(CHATS_KEY, threads);
  return newThread;
}

export async function getMessagesForChat(chatId: string): Promise<DirectMessage[]> {
  const all = (await get<DirectMessage[]>(MESSAGES_KEY)) || [];
  return all.filter(m => m.chatId === chatId).sort((a, b) => a.timestamp - b.timestamp);
}

export async function sendDirectMessage(chatId: string, senderId: string, text: string): Promise<DirectMessage> {
  const all = (await get<DirectMessage[]>(MESSAGES_KEY)) || [];
  const newMsg: DirectMessage = {
    id: crypto.randomUUID(),
    chatId,
    senderId,
    text,
    timestamp: Date.now()
  };
  all.push(newMsg);
  await set(MESSAGES_KEY, all);
  
  const threads = await getChatThreads();
  const thread = threads.find(t => t.id === chatId);
  if (thread) {
    thread.updatedAt = Date.now();
    await set(CHATS_KEY, threads);
  }
  
  return newMsg;
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const channels = await getChannels();
  const blocker = channels.find(c => c.id === blockerId);
  if (blocker) {
    if (!blocker.blockedUserIds) blocker.blockedUserIds = [];
    if (!blocker.blockedUserIds.includes(blockedId)) {
      blocker.blockedUserIds.push(blockedId);
      await set(CHANNELS_KEY, channels);
    }
  }
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const channels = await getChannels();
  const blocker = channels.find(c => c.id === blockerId);
  if (blocker && blocker.blockedUserIds) {
    blocker.blockedUserIds = blocker.blockedUserIds.filter(id => id !== blockedId);
    await set(CHANNELS_KEY, channels);
  }
}

export async function getPostsAll(): Promise<Post[]> {
  const posts = (await get<Post[]>(POSTS_KEY)) || [];
  posts.forEach(p => {
    if (!p.likes) p.likes = [];
  });
  return posts.sort((a,b) => b.timestamp - a.timestamp);
}

export async function addPost(post: Post): Promise<void> {
  const all = await getPostsAll();
  all.unshift(post);
  await set(POSTS_KEY, all);
}

export async function deletePost(id: string): Promise<void> {
  let all = await getPostsAll();
  all = all.filter(p => p.id !== id);
  await set(POSTS_KEY, all);
}

export async function likePost(id: string, channelId: string): Promise<void> {
  let all = await getPostsAll();
  const p = all.find(p => p.id === id);
  if (p) {
    if (!p.likes) p.likes = [];
    const idx = p.likes.indexOf(channelId);
    if (idx >= 0) p.likes.splice(idx, 1);
    else p.likes.push(channelId);
    await set(POSTS_KEY, all);
  }
}

export async function checkMigration(): Promise<void> {
  const version = await get<number>(VERSION_KEY) || 1;
  const targetVersion = 3; // Increment this to force wipe
  
  if (version < targetVersion) {
    // WIPE OLD VIDEOS AS REQUESTED
    await set(META_KEY, []);
    await set(CHANNELS_KEY, []);
    await del(MY_ID_KEY);
    await set(COMMENTS_KEY, []);
    
    // Clear all video blobs
    const keys = await import('idb-keyval').then(m => m.keys());
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith('nova_video_')) {
        await del(key);
      }
    }
    
    await set(VERSION_KEY, targetVersion);
  }
}

export async function initMyChannel(): Promise<Channel> {
  await checkMigration();
  let myId = await get<string>(MY_ID_KEY);
  let channels = await getChannels();
  
  if (!myId || !channels.find(c => c.id === myId)) {
    myId = crypto.randomUUID();
    const newChannel: Channel = {
      id: myId,
      handle: '@creator_' + Math.floor(Math.random() * 10000),
      displayName: 'Anonymous Creator',
      avatar: null,
      banner: null,
      bio: '',
      subscribers: [],
      createdAt: Date.now()
    };
    channels.push(newChannel);
    await set(CHANNELS_KEY, channels);
    await set(MY_ID_KEY, myId);
    return newChannel;
  }
  return channels.find(c => c.id === myId)!;
}

export async function getMyChannelId(): Promise<string> {
  const id = await get<string>(MY_ID_KEY);
  if (!id) {
    const ch = await initMyChannel();
    return ch.id;
  }
  return id;
}

export async function getChannels(): Promise<Channel[]> {
  return (await get<Channel[]>(CHANNELS_KEY)) || [];
}

export async function getChannel(id: string): Promise<Channel | undefined> {
  const channels = await getChannels();
  return channels.find(c => c.id === id);
}

export async function saveChannel(channel: Channel): Promise<void> {
  const channels = await getChannels();
  const index = channels.findIndex(c => c.id === channel.id);
  if (index >= 0) {
    channels[index] = channel;
  } else {
    channels.push(channel);
  }
  await set(CHANNELS_KEY, channels);
}

export async function getVideosMeta(): Promise<VideoMeta[]> {
  const meta = (await get<any[]>(META_KEY)) || [];
  const myId = await getMyChannelId();
  let migrated = false;
  meta.forEach(v => {
    if (!v.channelId) {
      v.channelId = myId;
      v.views = 0;
      v.likes = [];
      migrated = true;
    }
  });
  if (migrated) await set(META_KEY, meta);
  return meta;
}

export async function saveVideo(meta: VideoMeta, file: File): Promise<void> {
  const metaList = await getVideosMeta();
  metaList.unshift(meta);
  await set(META_KEY, metaList);
  await set(`nova_video_${meta.id}`, file);
}

export async function updateVideoMeta(meta: VideoMeta): Promise<void> {
  const metaList = await getVideosMeta();
  const i = metaList.findIndex(v => v.id === meta.id);
  if (i >= 0) {
    metaList[i] = meta;
    await set(META_KEY, metaList);
  }
}

export async function getVideoFile(id: string): Promise<File | undefined> {
  return await get(`nova_video_${id}`);
}

export async function deleteVideo(id: string): Promise<void> {
  let metaList = await getVideosMeta();
  metaList = metaList.filter(v => v.id !== id);
  await set(META_KEY, metaList);
  await del(`nova_video_${id}`);
  
  let comments = await getCommentsAll();
  comments = comments.filter(c => c.videoId !== id);
  await set(COMMENTS_KEY, comments);
  
  // Guarantee UI sync delay if needed, though idb is usually atomic enough
}

export async function setChannelLiveStatus(channelId: string, isLive: boolean): Promise<void> {
  const channels = await getChannels();
  const ch = channels.find(c => c.id === channelId);
  if (ch) {
    ch.isLive = isLive;
    await set(CHANNELS_KEY, channels);
  }
}

export async function getCommentsAll(): Promise<Comment[]> {
  const comments = (await get<Comment[]>(COMMENTS_KEY)) || [];
  comments.forEach(c => {
    if (!c.likes) c.likes = [];
  });
  return comments;
}

export async function getCommentsForVideo(videoId: string): Promise<Comment[]> {
  const all = await getCommentsAll();
  return all.filter(c => c.videoId === videoId).sort((a,b) => b.timestamp - a.timestamp);
}

export async function addComment(comment: Comment): Promise<void> {
  const all = await getCommentsAll();
  all.push(comment); // Append to list to maintain order, sorting happens in getComments
  await set(COMMENTS_KEY, all);
}

export async function deleteComment(id: string): Promise<void> {
  let all = await getCommentsAll();
  all = all.filter(c => c.id !== id && c.parentId !== id);
  await set(COMMENTS_KEY, all);
}

export async function likeComment(id: string, channelId: string): Promise<void> {
  let all = await getCommentsAll();
  const c = all.find(c => c.id === id);
  if (c) {
    if (!c.likes) c.likes = [];
    const idx = c.likes.indexOf(channelId);
    if (idx >= 0) c.likes.splice(idx, 1);
    else c.likes.push(channelId);
    await set(COMMENTS_KEY, all);
  }
}

export async function toggleSubscribe(targetChannelId: string, myChannelId: string): Promise<void> {
  const target = await getChannel(targetChannelId);
  if (!target) return;
  const subIndex = target.subscribers.indexOf(myChannelId);
  if (subIndex >= 0) {
    target.subscribers.splice(subIndex, 1);
  } else {
    target.subscribers.push(myChannelId);
  }
  await saveChannel(target);
}

export async function addView(videoId: string): Promise<void> {
  const metas = await getVideosMeta();
  const v = metas.find(v => v.id === videoId);
  if (v) {
    v.views = (v.views || 0) + 1;
    await set(META_KEY, metas);
  }
}

const HISTORY_KEY = 'nova_history';
const PLAYLISTS_KEY = 'nova_playlists';

export async function getHistory(): Promise<HistoryItem[]> {
  return (await get<HistoryItem[]>(HISTORY_KEY)) || [];
}

export async function addHistoryItem(videoId: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter(h => h.videoId !== videoId);
  filtered.unshift({
    id: crypto.randomUUID(),
    videoId,
    timestamp: Date.now()
  });
  await set(HISTORY_KEY, filtered.slice(0, 100));
}

export async function clearHistory(): Promise<void> {
  await set(HISTORY_KEY, []);
}

export async function getPlaylists(): Promise<Playlist[]> {
  return (await get<Playlist[]>(PLAYLISTS_KEY)) || [];
}

export async function createPlaylist(channelId: string, title: string, description: string): Promise<Playlist> {
  const playlists = await getPlaylists();
  const newPlaylist: Playlist = {
    id: crypto.randomUUID(),
    channelId,
    title,
    description,
    videoIds: [],
    timestamp: Date.now()
  };
  playlists.push(newPlaylist);
  await set(PLAYLISTS_KEY, playlists);
  return newPlaylist;
}

export async function updatePlaylist(playlist: Playlist): Promise<void> {
  const playlists = await getPlaylists();
  const index = playlists.findIndex(p => p.id === playlist.id);
  if (index >= 0) {
    playlists[index] = playlist;
    await set(PLAYLISTS_KEY, playlists);
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  let playlists = await getPlaylists();
  playlists = playlists.filter(p => p.id !== id);
  await set(PLAYLISTS_KEY, playlists);
}

export async function addReaction(videoId: string, emoji: string): Promise<void> {
  const metaList = await getVideosMeta();
  const v = metaList.find(x => x.id === videoId);
  if (v) {
    if (!v.reactions) v.reactions = {};
    v.reactions[emoji] = (v.reactions[emoji] || 0) + 1;
    await set(META_KEY, metaList);
  }
}
