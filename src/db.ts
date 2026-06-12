import { set as idbSet, get as idbGet, del as idbDel } from 'idb-keyval';
import { VideoMeta, Channel, Comment, Post, ChatThread, DirectMessage, Playlist, HistoryItem } from './types';
import { db, auth, loginWithGoogle } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

const META_COLLECTION = 'nova_videos_meta';
const CHANNELS_COLLECTION = 'nova_channels';
const COMMENTS_COLLECTION = 'nova_comments';
const POSTS_COLLECTION = 'nova_posts';
const CHATS_COLLECTION = 'nova_chats';
const MESSAGES_COLLECTION = 'nova_messages';
const PLAYLISTS_COLLECTION = 'nova_playlists';

let myChannelId: string | null = null;
if (localStorage.getItem('nova_my_channel_id')) {
  myChannelId = localStorage.getItem('nova_my_channel_id');
} else {
  myChannelId = crypto.randomUUID();
  localStorage.setItem('nova_my_channel_id', myChannelId);
}

export async function getMyChannelId(): Promise<string> {
  const ch = await getChannel(myChannelId!);
  if (!ch) {
    const newChannel: Channel = {
      id: myChannelId!,
      handle: '@creator_' + Math.floor(Math.random() * 10000),
      displayName: 'Firebase Creator',
      avatar: null,
      banner: null,
      bio: '',
      subscribers: [],
      createdAt: Date.now()
    };
    await saveChannel(newChannel);
  }
  return myChannelId!;
}

export async function initMyChannel(): Promise<Channel> {
  const id = await getMyChannelId();
  return (await getChannel(id))!;
}

export async function getChannels(): Promise<Channel[]> {
  const snapshot = await getDocs(collection(db, CHANNELS_COLLECTION));
  return snapshot.docs.map(d => d.data() as Channel);
}

export async function getChannel(id: string): Promise<Channel | undefined> {
  const d = await getDoc(doc(db, CHANNELS_COLLECTION, id));
  if (d.exists()) return d.data() as Channel;
  return undefined;
}

export async function saveChannel(channel: Channel): Promise<void> {
  await setDoc(doc(db, CHANNELS_COLLECTION, channel.id), channel);
}

export async function getVideosMeta(): Promise<VideoMeta[]> {
  const q = query(collection(db, META_COLLECTION), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as VideoMeta);
}

export async function saveVideo(meta: VideoMeta, file: File): Promise<void> {
  // Store file locally instead of stateless server API
  await idbSet(`video_file_${meta.id}`, file);
  
  meta.videoUrl = `/local/${meta.id}`; // Optional placeholder URL
  await setDoc(doc(db, META_COLLECTION, meta.id), meta);
}

export async function updateVideoMeta(meta: VideoMeta): Promise<void> {
  await updateDoc(doc(db, META_COLLECTION, meta.id), { ...meta });
}

export async function getVideoFile(id: string): Promise<File | undefined> {
  return await idbGet(`video_file_${id}`);
}

export async function deleteVideo(id: string): Promise<void> {
  await deleteDoc(doc(db, META_COLLECTION, id));
  await idbDel(`video_file_${id}`);
}

export async function toggleSubscribe(targetChannelId: string, myChannelId: string): Promise<void> {
  const target = await getChannel(targetChannelId);
  if (!target) return;
  const subIndex = target.subscribers.indexOf(myChannelId);
  if (subIndex >= 0) target.subscribers.splice(subIndex, 1);
  else target.subscribers.push(myChannelId);
  await saveChannel(target);
}

export async function addView(videoId: string): Promise<void> {
  const d = await getDoc(doc(db, META_COLLECTION, videoId));
  if (d.exists()) {
    const meta = d.data() as VideoMeta;
    meta.views = (meta.views || 0) + 1;
    await updateVideoMeta(meta);
  }
}

export async function addReaction(videoId: string, emoji: string): Promise<void> {
  const d = await getDoc(doc(db, META_COLLECTION, videoId));
  if (d.exists()) {
    const meta = d.data() as VideoMeta;
    if (!meta.reactions) meta.reactions = {};
    meta.reactions[emoji] = (meta.reactions[emoji] || 0) + 1;
    await updateVideoMeta(meta);
  }
}

export async function getCommentsForVideo(videoId: string): Promise<Comment[]> {
  const q = query(collection(db, COMMENTS_COLLECTION), where("videoId", "==", videoId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Comment).sort((a,b) => b.timestamp - a.timestamp);
}

export async function getCommentsAll(): Promise<Comment[]> {
  const snapshot = await getDocs(collection(db, COMMENTS_COLLECTION));
  return snapshot.docs.map(d => d.data() as Comment);
}

export async function addComment(comment: Comment): Promise<void> {
  await setDoc(doc(db, COMMENTS_COLLECTION, comment.id), comment);
}

export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(db, COMMENTS_COLLECTION, id));
}

export async function likeComment(id: string, channelId: string): Promise<void> {
  const d = await getDoc(doc(db, COMMENTS_COLLECTION, id));
  if (d.exists()) {
    const c = d.data() as Comment;
    if (!c.likes) c.likes = [];
    const idx = c.likes.indexOf(channelId);
    if (idx >= 0) c.likes.splice(idx, 1);
    else c.likes.push(channelId);
    await updateDoc(doc(db, COMMENTS_COLLECTION, id), { likes: c.likes });
  }
}

// ... Additional exports need to be maintained to fix imports
export async function checkMigration(): Promise<void> {}

export async function getPostsAll(): Promise<Post[]> {
  const q = query(collection(db, POSTS_COLLECTION), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Post);
}

export async function addPost(post: Post): Promise<void> {
  if (post.imageUrl && post.imageUrl.startsWith('data:')) {
    await idbSet(`post_img_${post.id}`, post.imageUrl);
    post.imageUrl = `/local_post/${post.id}`;
  }
  await setDoc(doc(db, POSTS_COLLECTION, post.id), post);
}

export async function getPostImage(id: string): Promise<string | undefined> {
  return await idbGet(`post_img_${id}`);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
}

export async function likePost(id: string, channelId: string): Promise<void> {
  const d = await getDoc(doc(db, POSTS_COLLECTION, id));
  if (d.exists()) {
    const p = d.data() as Post;
    if (!p.likes) p.likes = [];
    const idx = p.likes.indexOf(channelId);
    if (idx >= 0) p.likes.splice(idx, 1);
    else p.likes.push(channelId);
    await updateDoc(doc(db, POSTS_COLLECTION, id), { likes: p.likes });
  }
}

export async function replyToPost(postId: string, reply: { id: string; channelId: string; text: string; timestamp: number }): Promise<void> {
  const d = await getDoc(doc(db, POSTS_COLLECTION, postId));
  if (d.exists()) {
    const p = d.data() as Post;
    if (!p.replies) p.replies = [];
    p.replies.push(reply);
    await updateDoc(doc(db, POSTS_COLLECTION, postId), { replies: p.replies });
  }
}

export async function getChatThreads(): Promise<ChatThread[]> {
  const snapshot = await getDocs(collection(db, CHATS_COLLECTION));
  return snapshot.docs.map(d => d.data() as ChatThread);
}

export async function createChatThread(participantIds: string[], isGroup: boolean = false, name?: string): Promise<ChatThread> {
  const id = crypto.randomUUID();
  const thread: ChatThread = { id, isGroup, name, participantIds: participantIds.sort(), updatedAt: Date.now() };
  await setDoc(doc(db, CHATS_COLLECTION, id), thread);
  return thread;
}

export async function getMessagesForChat(chatId: string): Promise<DirectMessage[]> {
  const q = query(collection(db, MESSAGES_COLLECTION), where("chatId", "==", chatId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as DirectMessage).sort((a,b) => a.timestamp - b.timestamp);
}

export async function sendDirectMessage(chatId: string, senderId: string, text: string): Promise<DirectMessage> {
  const id = crypto.randomUUID();
  const msg: DirectMessage = { id, chatId, senderId, text, timestamp: Date.now() };
  await setDoc(doc(db, MESSAGES_COLLECTION, id), msg);
  await updateDoc(doc(db, CHATS_COLLECTION, chatId), { updatedAt: Date.now() });
  return msg;
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {}
export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {}
export async function setChannelLiveStatus(channelId: string, isLive: boolean): Promise<void> {}

export async function getHistory(): Promise<HistoryItem[]> { return []; }
export async function addHistoryItem(videoId: string): Promise<void> {}
export async function clearHistory(): Promise<void> {}

export async function getPlaylists(): Promise<Playlist[]> {
  const snapshot = await getDocs(collection(db, PLAYLISTS_COLLECTION));
  return snapshot.docs.map(d => d.data() as Playlist);
}

export async function createPlaylist(channelId: string, title: string, description: string): Promise<Playlist> {
  const id = crypto.randomUUID();
  const pl: Playlist = { id, channelId, title, description, videoIds: [], timestamp: Date.now() };
  await setDoc(doc(db, PLAYLISTS_COLLECTION, id), pl);
  return pl;
}

export async function updatePlaylist(playlist: Playlist): Promise<void> {
  await updateDoc(doc(db, PLAYLISTS_COLLECTION, playlist.id), { ...playlist });
}

export async function deletePlaylist(id: string): Promise<void> {
  await deleteDoc(doc(db, PLAYLISTS_COLLECTION, id));
}
