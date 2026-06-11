import React, { useEffect } from 'react';
import { getChannels, saveChannel, getPostsAll, addPost, getVideosMeta, saveVideo, addComment, getCommentsAll } from '../db';
import { Channel, Post, VideoMeta, Comment } from '../types';

const botProfiles = [
  { name: "Sarah Müller", bio: "Reisen, Essen und gute Vibes ☀️" },
  { name: "Alexander Weber", bio: "Technologie-Enthusiast aus Berlin." },
  { name: "Mia Wagner", bio: "Kreativität kennt keine Grenzen! 🎨" },
  { name: "David Fischer", bio: "Gamer, Foodie und Kaffeeliebhaber." },
  { name: "Laura Krause", bio: "Lifestyle & Fitness Journey 💪" }
];

function createBotChannel(id: string, index: number): Channel {
  const profile = botProfiles[(index - 1) % botProfiles.length];

  return {
    id,
    handle: `@${profile.name.toLowerCase().replace(' ', '_')}`,
    displayName: profile.name,
    avatar: `https://picsum.photos/seed/user${index * 10}/100`,
    banner: null,
    bio: profile.bio,
    subscribers: [],
    createdAt: Date.now()
  };
}

export function BotEngine() {
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupBots = async () => {
      const channels = await getChannels();
      const botIds = ['bot_1', 'bot_2', 'bot_3', 'bot_4', 'bot_5'];
      let botsCreated = false;
      
      for (let i = 0; i < botIds.length; i++) {
        const id = botIds[i];
        if (!channels.find(c => c.id === id)) {
          await saveChannel(createBotChannel(id, i + 1));
          botsCreated = true;
        }
      }

      const botActions = async () => {
        const botId = botIds[Math.floor(Math.random() * botIds.length)];
        const profile = botProfiles[(parseInt(botId.split('_')[1]) - 1)];
        
        // Random action: 0 = post short, 1 = comment, 2 = post community, 3 = subscribe, 4 = reply community post
        const action = Math.floor(Math.random() * 5);
        
        if (action === 0) {
          const topics = ["a beautiful sunset over a cyberpunk city", "a cute dog playing in the park", "making a fast coffee latte art", "unboxing a cool new tech gadget", "a daily vlog morning routine aesthetic"];
          const topic = topics[Math.floor(Math.random() * topics.length)];
          const prompt = `A highly realistic, vertical phone video freeze frame of ${topic}`;
          
          try {
            // Get AI title and desc
            const capRes = await fetch('/api/bot-action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'caption', payload: { topic } })
            });
            const capData = await capRes.json();
            const capJson = JSON.parse(capData.text.replace(/^```json|```$/g, '').trim());

            const res = await fetch('/api/generate-post-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            
            if (data.image) {
              const videoId = crypto.randomUUID();
              
              let blob;
              // Handle relative or absolute fallback URL
              if (data.image.startsWith('http')) {
                const res2 = await fetch(data.image);
                blob = await res2.blob();
              } else {
                const res2 = await fetch(data.image);
                blob = await res2.blob();
              }
              const file = new File([blob], "ai_short.jpg", { type: "image/jpeg" });
              
              const meta: VideoMeta = {
                id: videoId,
                title: capJson.title || "My new video",
                description: capJson.description || "Check it out",
                hashtags: capJson.hashtags || [],
                thumbnail: data.image,
                timestamp: Date.now(),
                channelId: botId,
                views: 0,
                duration: 15,
                isShort: true,
                likes: [],
                size: file.size
              };
              
              await saveVideo(meta, file);
            }
          } catch (e) {
            console.warn('Bot short generation failed', e);
          }
        } else if (action === 1) {
          const videos = await getVideosMeta();
          if (videos.length > 0) {
            const video = videos[Math.floor(Math.random() * videos.length)];
            const subAction = Math.random() > 0.4;
            if (subAction) {
              try {
                const aiRes = await fetch('/api/bot-action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'comment', payload: { name: profile.name, bio: profile.bio, videoTitle: video.title } })
                });
                const aiData = await aiRes.json();
                await addComment({
                  id: crypto.randomUUID(),
                  videoId: video.id,
                  channelId: botId,
                  text: aiData.text,
                  timestamp: Date.now(),
                  likes: []
                });
              } catch (e) {
                console.warn(e);
              }
            } else {
               import('../db').then(db => db.addReaction(video.id, '🚀').catch(() => {}));
            }
          }
        } else if (action === 2) {
          try {
            const aiRes = await fetch('/api/bot-action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'post', payload: { name: profile.name, bio: profile.bio } })
            });
            const aiData = await aiRes.json();
            await addPost({
              id: crypto.randomUUID(),
              channelId: botId,
              content: aiData.text,
              timestamp: Date.now(),
              likes: []
            });
          } catch (e) {
            console.warn(e);
          }
        } else if (action === 3) {
          // Subscribe to someone
          const allChannels = await getChannels();
          const randomChannel = allChannels[Math.floor(Math.random() * allChannels.length)];
          if (randomChannel.id !== botId) {
             import('../db').then(db => db.toggleSubscribe(randomChannel.id, botId).catch(() => {}));
          }
        } else if (action === 4) {
          // Reply to community post
          import('../db').then(async db => {
             const posts = await db.getPostsAll();
             if (posts.length > 0) {
               const post = posts[Math.floor(Math.random() * posts.length)];
               try {
                 const aiRes = await fetch('/api/bot-action', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ type: 'reply', payload: { name: profile.name, bio: profile.bio, postText: post.content } })
                 });
                 const aiData = await aiRes.json();
                 await db.replyToPost(post.id, {
                    id: crypto.randomUUID(),
                    channelId: botId,
                    text: aiData.text,
                    timestamp: Date.now()
                 });
               } catch (e) {
                 console.warn(e);
               }
             }
          });
        }
      };

      interval = setInterval(botActions, 45000);
      if (botsCreated) botActions();
    };

    setupBots();

    return () => clearInterval(interval);
  }, []);

  return null;
}
