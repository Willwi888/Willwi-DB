
import React, { useRef, useState, useEffect } from 'react';
import { useData, resolveDirectLink } from '../context/DataContext';
import { useLocation } from 'react-router-dom';

const GlobalPlayer: React.FC = () => {
  const { currentSong, isPlaying, setIsPlaying } = useData();
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 僅在「互動創作 (錄音對位)」模式下隱藏全局播放器，以防衝突
  const isInteractivePlaying = location.pathname === '/interactive';

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !currentSong || isInteractivePlaying) return;

      if (isPlaying) {
          setErrorMsg(null);
          setIsLoading(true);
          audio.play().then(() => setIsLoading(false)).catch((e) => {
              console.error("Playback failed:", e);
              setIsPlaying(false);
              setIsLoading(false);
              setErrorMsg("無法連接音訊源。");
          });
      } else {
          audio.pause();
      }
  }, [isPlaying, currentSong, isInteractivePlaying, setIsPlaying]);

  if (!currentSong || isInteractivePlaying) return null;

  const currentAudioSrc = resolveDirectLink(currentSong.audioUrl || '');

  const formatTime = (seconds: number) => {
      if (!seconds || isNaN(seconds)) return "00:00";
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (audioRef.current) {
          const newTime = Number(e.target.value);
          audioRef.current.currentTime = newTime;
          setProgress(newTime);
      }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-[1000] animate-fade-in-up">
        {errorMsg && (
            <div className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-8 py-1.5 text-center">
                {errorMsg}
            </div>
        )}
        
        {/* 音樂進度條 */}
        <div className="w-full h-1.5 md:h-2 bg-white/10 cursor-pointer relative group transition-all hover:h-3">
            <div 
                className="h-full bg-brand-gold shadow-[0_0_20px_#fbbf24] transition-all duration-300 relative z-10" 
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover:scale-100 transition-transform shadow-xl border-2 border-brand-gold"></div>
            </div>
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={progress} 
              onChange={handleSeek} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
            />
        </div>

        {/* 主播放面板 */}
        <div className="bg-black/95 backdrop-blur-3xl border-t border-white/5 px-8 py-6 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-6 w-1/3">
                <div className="relative shrink-0 overflow-hidden rounded-sm">
                    <img src={currentSong.coverUrl} className={`w-16 h-16 object-cover border border-white/10 transition-transform duration-1000 ${isPlaying ? 'scale-110 rotate-1' : ''}`} alt="" />
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-white text-sm font-black uppercase truncate tracking-[0.25em]">{currentSong.title}</h4>
                    <p className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.15em] mt-1 opacity-60">MASTERING MONITOR</p>
                </div>
            </div>
            
            <div className="flex items-center justify-center gap-10 w-1/3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)} 
                  className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-brand-gold hover:scale-110 transition-all shadow-2xl active:scale-95"
                >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                </button>
            </div>
            
            <div className="flex items-center justify-end gap-10 w-1/3 font-mono text-[10px] tracking-widest text-slate-400">
                <span className="min-w-[100px] text-right font-bold text-white">
                    {formatTime(progress)} <span className="opacity-20 mx-2">/</span> {formatTime(duration)}
                </span>
            </div>
        </div>
        <audio 
            ref={audioRef} 
            src={currentAudioSrc} 
            crossOrigin="anonymous"
            onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
        />
    </div>
  );
};

export default GlobalPlayer;
