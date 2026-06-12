import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Scissors, Layers, Type, Music, Settings, Sparkles, Wand2, Download, MonitorPlay } from 'lucide-react';
import { VideoMeta } from '../types';
import { useLanguage } from '../LanguageContext';

interface StudioViewProps {
  onClose: () => void;
  initialVideo?: VideoMeta;
}

export function StudioView({ onClose, initialVideo }: StudioViewProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'effects' | 'ai'>('timeline');
  const [timelineScale, setTimelineScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [currentVideo, setCurrentVideo] = useState<VideoMeta | undefined>(initialVideo);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Edit states
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0);

  const getMediaStyle = (): React.CSSProperties => {
    return {
      transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blurAmount}px)`,
      transition: 'all 0.1s ease-out'
    };
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            alert("Export complete! Saved to device.");
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const handleAiAction = (action: string) => {
    alert(`AI Processing: ${action}. This may take a moment depending on server load.`);
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setCurrentVideo({
        id: 'studio-temp',
        title: file.name,
        description: '',
        channelId: '',
        videoUrl: url,
        thumbnail: '',
        timestamp: Date.now(),
        views: 0,
        likes: [],
        mediaType: file.type.startsWith('image/') ? 'image' : 'video'
      });
    } else {
      alert("Please select a video or image file.");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-zinc-950 flex flex-col text-zinc-300 font-sans"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      }}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        accept="video/*,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-lime-400/10 backdrop-blur-sm border-4 border-lime-400 border-dashed flex items-center justify-center pointer-events-none">
          <span className="font-display text-4xl text-lime-400 font-bold tracking-widest uppercase animate-pulse">Drop Media Here</span>
        </div>
      )}
      {/* Top Navbar */}
      <div className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-100" />
          </button>
          <span className="font-display font-bold uppercase tracking-widest text-lime-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> KynxTV Studio Pro
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-zinc-800 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <Settings className="w-3.5 h-3.5" /> Project Settings
          </button>
          <button 
            onClick={startExport}
            className="flex items-center gap-2 px-6 py-1.5 bg-lime-400 text-lime-950 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-lime-500 transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)]"
          >
            <Download className="w-3.5 h-3.5" /> Export 4K
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 border-r border-zinc-900 bg-zinc-950 flex flex-col items-center py-4 gap-6 shrink-0">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10 transition-colors tooltip relative group">
            <Layers className="w-5 h-5" />
            <span className="absolute left-14 top-2 bg-zinc-800 text-zinc-100 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Add Media</span>
          </button>
          <button onClick={() => setActiveTab('timeline')} className={`p-3 rounded-xl transition-colors relative group ${activeTab === 'timeline' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-900 text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10'}`}>
            <Settings className="w-5 h-5" />
            <span className="absolute left-14 top-2 bg-zinc-800 text-zinc-100 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Transform</span>
          </button>
          <button onClick={() => setActiveTab('effects')} className={`p-3 rounded-xl transition-colors relative group ${activeTab === 'effects' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-900 text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10'}`}>
            <Wand2 className="w-5 h-5" />
            <span className="absolute left-14 top-2 bg-zinc-800 text-zinc-100 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Color Filters</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`p-3 rounded-xl transition-colors relative group ${activeTab === 'ai' ? 'bg-lime-400/20 text-lime-400' : 'bg-zinc-900 text-zinc-400 hover:text-lime-400 hover:bg-lime-400/10'}`}>
            <Sparkles className="w-5 h-5" />
            <span className="absolute left-14 top-2 bg-zinc-800 text-zinc-100 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">AI Compute</span>
          </button>
        </div>

        {/* Main Stage & Right Panel */}
        <div className="flex-1 flex flex-col">
          {/* Preview Window and Settings split */}
          <div className="flex-1 flex bg-[#0c0c0e] relative">
            {/* Stage */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-zinc-900 relative">
              <div className="w-full max-w-4xl aspect-video bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl relative group">
                {currentVideo ? (
                  currentVideo.mediaType === 'image' ? (
                     <img src={currentVideo.videoUrl} className="w-full h-full object-contain" alt="Studio media" style={getMediaStyle()} />
                  ) : (
                     <video ref={videoRef} src={currentVideo.videoUrl} className="w-full h-full object-contain" style={getMediaStyle()} />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative bg-[url('https://transparenttextures.com/patterns/carbon-fibre.png')]">
                    <MonitorPlay className="w-16 h-16 text-zinc-800 mb-4" />
                    <span className="font-display font-bold tracking-widest uppercase text-zinc-600 mb-4">{t('No Media Selected')}</span>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-lime-400 text-lime-950 font-bold uppercase tracking-widest text-xs rounded hover:bg-lime-500 transition-colors"
                    >
                      {t('Import Media')}
                    </button>
                    <p className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{t('Or Drag & Drop')}</p>
                  </div>
                )}
                
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/50 backdrop-blur text-[10px] font-mono text-lime-400 px-2 py-1 rounded border border-white/10 uppercase font-bold tracking-widest">3840x2160 (4K)</span>
                  <span className="bg-black/50 backdrop-blur text-[10px] font-mono text-blue-400 px-2 py-1 rounded border border-white/10 uppercase font-bold tracking-widest">60 FPS</span>
                </div>
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center gap-6 mt-6 bg-zinc-900/50 backdrop-blur px-8 py-3 rounded-2xl border border-zinc-800/50">
                <span className="font-mono text-xs text-zinc-400">00:00:00:00</span>
                <button onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                  }
                }} className="w-10 h-10 rounded-full bg-lime-400 text-black flex items-center justify-center hover:bg-lime-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <span className="font-mono text-xs text-zinc-600">00:15:30:00</span>
              </div>
            </div>

            {/* Right Inspector Panel */}
            <div className="w-80 bg-zinc-950 flex flex-col shrink-0">
              <div className="flex border-b border-zinc-900 p-2 gap-2 shrink-0">
                <button className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded transition-colors ${activeTab === 'timeline' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setActiveTab('timeline')}>Edit</button>
                <button className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded transition-colors ${activeTab === 'ai' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setActiveTab('ai')}>AI Compute</button>
                <button className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded transition-colors ${activeTab === 'effects' ? 'bg-zinc-800 text-lime-400' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={() => setActiveTab('effects')}>Color</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                {activeTab === 'timeline' && (
                  <>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Settings className="w-3 h-3" /> Transform</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Scale</span><span>{scale}%</span></div>
                          <input type="range" min="10" max="300" value={scale} onChange={e => setScale(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Rotation</span><span>{rotation}°</span></div>
                          <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => { setScale(100); setRotation(0); }} className="flex-1 bg-zinc-900 border border-zinc-800 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors">Reset</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'effects' && (
                  <>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2"><Wand2 className="w-3 h-3" /> Filters</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Brightness</span><span>{brightness}%</span></div>
                          <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Contrast</span><span>{contrast}%</span></div>
                          <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Saturation</span><span>{saturation}%</span></div>
                          <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>Blur</span><span>{blurAmount}px</span></div>
                          <input type="range" min="0" max="20" step="0.5" value={blurAmount} onChange={e => setBlurAmount(Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-lime-400" />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setBlurAmount(0); }} className="flex-1 bg-zinc-900 border border-zinc-800 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-zinc-800 transition-colors">Reset All</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-4 relative overflow-hidden group hover:border-lime-400/40 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-lime-400/20 blur-2xl rounded-full"></div>
                      <h3 className="text-sm font-bold text-lime-400 mb-1">AI 4K Upscaler</h3>
                      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Enhance resolution and details using next-gen AI upscaling models.</p>
                      <button onClick={() => handleAiAction("Upscaling to 4K Pro")} className="w-full bg-lime-400/10 text-lime-400 font-bold uppercase tracking-widest text-xs py-2 rounded border border-lime-400/20 hover:bg-lime-400 hover:text-black transition-all">Enhance Image</button>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/20 blur-2xl rounded-full"></div>
                      <h3 className="text-sm font-bold text-indigo-400 mb-1">Auto-Cut Silence</h3>
                      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Automatically detect and remove dead air in the video.</p>
                      <button onClick={() => handleAiAction("Removing dead silence")} className="w-full bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-widest text-xs py-2 rounded border border-indigo-500/20 hover:bg-indigo-500 hover:text-black transition-all">Apply Auto-Cut</button>
                    </div>

                    <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl p-4 relative overflow-hidden group hover:border-fuchsia-500/40 transition-colors">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500/20 blur-2xl rounded-full"></div>
                      <h3 className="text-sm font-bold text-fuchsia-400 mb-1">Vocal Isolation</h3>
                      <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Remove background noise and enhance speech clarity.</p>
                      <button onClick={() => handleAiAction("Isolating vocals")} className="w-full bg-fuchsia-500/10 text-fuchsia-400 font-bold uppercase tracking-widest text-xs py-2 rounded border border-fuchsia-500/20 hover:bg-fuchsia-500 hover:text-black transition-all">Clean Audio</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Panel */}
          <div className="h-64 border-t border-zinc-900 bg-[#0c0c0e] flex flex-col shrink-0">
            {/* Timeline Toolbar */}
            <div className="h-8 border-b border-zinc-900 flex items-center px-4 justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <button className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-zinc-100" title="Split Track"><Scissors className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Zoom</span>
                <input 
                  type="range" 
                  min="0.5" max="3" step="0.1" 
                  value={timelineScale} 
                  onChange={e => setTimelineScale(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-zinc-800 rounded-full appearance-none accent-zinc-500" 
                />
              </div>
            </div>
            
            {/* Tracks */}
            <div className="flex-1 overflow-auto relative p-4 pl-0">
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-32 w-px bg-lime-400 z-10">
                <div className="w-3 h-3 border-2 border-lime-400 rounded-full -ml-1.5 -mt-1.5 bg-black"></div>
              </div>

              <div className="space-y-1 w-[200%]">
                {/* Video Track */}
                <div className="flex h-14 bg-zinc-900/30 rounded-r border-y border-r border-zinc-800">
                  <div className="w-24 shrink-0 bg-zinc-950 border-r border-zinc-800 flex items-center px-4 font-mono text-[10px] text-zinc-500 tracking-widest sticky left-0 z-20">V1</div>
                  <div className="flex-1 relative p-1 group">
                    <div className="absolute left-8 right-48 top-1 bottom-1 bg-blue-500/20 border border-blue-500/40 rounded flex overflow-hidden">
                      {/* Fake video thumbnails */}
                      {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="flex-1 border-r border-blue-500/20 bg-blue-900/20"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audio Track */}
                <div className="flex h-14 bg-zinc-900/30 rounded-r border-y border-r border-zinc-800">
                  <div className="w-24 shrink-0 bg-zinc-950 border-r border-zinc-800 flex items-center px-4 font-mono text-[10px] text-zinc-500 tracking-widest sticky left-0 z-20">A1</div>
                  <div className="flex-1 relative p-1 group">
                    <div className="absolute left-8 right-48 top-1 bottom-1 bg-green-500/20 border border-green-500/40 rounded flex items-center px-2">
                       {/* Waveform fake */}
                       <svg className="w-full h-full opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                         <path d="M0,50 Q5,10 10,50 T20,50 T30,50 T40,20 T50,50 T60,80 T70,50 T80,50 T90,30 T100,50" fill="none" stroke="#22c55e" strokeWidth="2"/>
                       </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="w-96 text-center">
             <div className="mb-8 font-display font-bold uppercase tracking-widest text-lime-400 text-xl animate-pulse">Rendering 4K AI Stream</div>
             <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div className="h-full bg-lime-400 transition-all duration-200" style={{ width: `${exportProgress}%` }}></div>
             </div>
             <div className="mt-4 font-mono text-zinc-500 text-xs">{exportProgress}% Completed</div>
           </div>
        </div>
      )}
    </div>
  );
}
