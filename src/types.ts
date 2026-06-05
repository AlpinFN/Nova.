export interface Channel {
  id: string;
  handle: string;
  displayName: string;
  avatar: string | null;
  banner: string | null;
  bio: string;
  subscribers: string[];
  isLive?: boolean;
  createdAt?: number;
  blockedUserIds?: string[];
}

export interface VideoMeta {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  timestamp: number;
  size: number;
  duration?: number;
  views: number;
  likes: string[];
  isShort?: boolean;
  hashtags?: string[];
  reactions?: Record<string, number>;
}

export interface Comment {
  id: string;
  videoId: string;
  channelId: string;
  text: string;
  timestamp: number;
  likes?: string[];
  parentId?: string;
}

export interface Playlist {
  id: string;
  channelId: string;
  title: string;
  description: string;
  videoIds: string[];
  timestamp: number;
}

export interface SubtitleStyle {
  fontSize: string;
  color: string;
  background: string;
}

export interface HistoryItem {
  id: string;
  videoId: string;
  timestamp: number;
}

export interface Post {
  id: string;
  channelId: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
  likes: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  text: string;
  timestamp: number;
}

export interface DirectMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  isGroup: boolean;
  name?: string;
  participantIds: string[];
  updatedAt: number;
}

