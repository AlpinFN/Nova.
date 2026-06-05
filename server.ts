import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // AI Suggestion Route
  app.post('/api/suggest-video', async (req, res) => {
    try {
      const { filename } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Suggest a catchy title, a short engaging description, and up to 3 relevant hashtags for a video file named "${filename}". 
Respond ONLY in JSON format: {"title": "Suggested Title", "description": "Suggested description", "hashtags": ["#tag1", "#tag2", "#tag3"]}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI suggestion." });
    }
  });

  // AI Recommendation Route
  app.post('/api/recommend-videos', async (req, res) => {
    try {
      const { query, videos } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const videosInfo = videos.map((v: any) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        hashtags: v.hashtags || []
      }));

      const prompt = `You are a helpful video recommender.
The user is looking for: "${query}".
Here are the available videos:
${JSON.stringify(videosInfo)}

Select the best matching videos from the list. Respond ONLY in JSON format, an array of strings representing the video "id"s of the best matches, e.g. ["id1", "id2"]. If none match, return an empty array [].`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const text = response.text || "[]";
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations." });
    }
  });

  app.post('/api/generate-post-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Missing API key' });
      
      try {
        const ai = new GoogleGenAI({ 
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const response = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1'
          }
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
          const base64Image = response.generatedImages[0].image.imageBytes;
          res.json({ image: 'data:image/jpeg;base64,' + base64Image });
          return;
        }
      } catch (aiError) {
        console.warn('AI Image generation failed (likely free tier limit), falling back to Picsum.', aiError);
      }
      
      // Fallback
      const randomId = Math.floor(Math.random() * 1000);
      const fallbackUrl = `https://picsum.photos/seed/${randomId}/800/800`;
      
      // We actually need base64 if possible, or just the URL.
      // Wait, can we just send the URL? Yes, the client handles it as imageUrl.
      // Let's send the URL.
      res.json({ image: fallbackUrl });
      
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  app.post('/api/generate-post-text', async (req, res) => {
    try {
      const { topic } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write an engaging, short community post description (max 3 sentences) about this topic: ${topic}. Don't use quotes or extra formatting, just the text.`,
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
