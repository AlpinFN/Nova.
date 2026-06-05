import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number) {
  if (isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTimeAgo(timestamp: number): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference === 0) {
    const hours = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.round((timestamp - Date.now()) / (1000 * 60));
      if (minutes === 0) return 'Just now';
      return rtf.format(minutes, 'minute');
    }
    return rtf.format(hours, 'hour');
  }
  
  return rtf.format(daysDifference, 'day');
}

export function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return views.toString();
}

export function generateThumbnail(file: File): Promise<{ thumbnail: string, duration: number, width: number, height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    
    // We need objectURL to load video in memory
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Seek to 1 second or 20% of video
      video.currentTime = Math.min(1, video.duration > 0 ? video.duration * 0.2 : 0);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve({
          thumbnail: canvas.toDataURL('image/jpeg', 0.6),
          duration: video.duration,
          width: canvas.width,
          height: canvas.height
        });
      } else {
        reject(new Error("Could not get canvas context"));
      }
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error loading video"));
    };

    video.src = url;
  });
}
