
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useData, resolveDirectLink } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

type InteractionMode = 'intro' | 'unlock' | 'select' | 'playing' | 'mastered';
const STUDIO_SESSION_KEY = 'willwi_studio_unlocked';

interface SyncTimestamp {
    time: number;
    text: string;
}

const Interactive: React.FC = () => {
  const { songs, globalSettings, updateSong } = useData();
  const { isAdmin } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<InteractionMode>('intro');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [unlockInput, setUnlockInput] = useState('');
  const [isPaused, setIsPaused] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [timestamps, setTimestamps] = useState<SyncTimestamp[]>([]);
  const [isMarking, setIsMarking] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const requestRef = useRef<number>(null);
  const offscreenImgRef = useRef<HTMLImageElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isSessionUnlocked = useCallback(() => {
    return isAdmin || sessionStorage.getItem(STUDIO_SESSION_KEY) === 'true';
  }, [isAdmin]);

  const lyricsLines = useMemo(() => {
    if (!selectedSong?.lyrics) return ["LYRICS END"];
    const rawLines = selectedSong.lyrics.split('\n')
      .map(l => l.replace(/\[\d+:\d+\.\d+\]/g, '').trim())
      .filter(l => l.length > 0);
    return [...rawLines, "歌詞結束"];
  }, [selectedSong]);

  useEffect(() => {
    if (selectedSong?.coverUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = selectedSong.coverUrl;
        img.onload = () => { offscreenImgRef.current = img; };
    }
  }, [selectedSong]);

  // 同步滾動清單視角
  useEffect(() => {
    if (listRef.current) {
        const activeElement = listRef.current.querySelector('.active-lyric');
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentLineIndex]);

  // 動態產出引擎 (Cinema Noise Edition)
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedSong || !offscreenImgRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = offscreenImgRef.current;
    const now = Date.now();
    
    // 1. 背景層：氛圍呼吸感
    ctx.save();
    const bgBreath = 1.05 + Math.sin(now / 5000) * 0.02;
    ctx.filter = 'blur(120px) brightness(0.15) saturate(0.6)';
    const bW = canvas.width * bgBreath;
    const bH = canvas.height * bgBreath;
    ctx.drawImage(img, (canvas.width - bW)/2, (canvas.height - bH)/2, bW, bH);
    ctx.restore();

    // 2. 主視覺：1:1 官方明亮封面 (地圖視點)
    ctx.save();
    const coverSize = 700;
    const coverX = canvas.width - coverSize - 120;
    const coverY = (canvas.height - coverSize) / 2;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 100;
    ctx.drawImage(img, coverX, coverY, coverSize, coverSize);
    ctx.restore();

    // 3. 滾動歌詞層 (由下往上滑動)
    ctx.save();
    const listX = 140;
    const centerY = canvas.height / 2;
    const spacing = 130;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = -4; i <= 4; i++) {
        const idx = currentLineIndex + i;
        if (idx < 0 || idx >= lyricsLines.length) continue;
        const opacity = Math.max(0, 1 - Math.abs(i) * 0.25);
        const y = centerY + (i * spacing);
        
        if (i === 0) {
            ctx.fillStyle = isMarking ? '#fbbf24' : '#ffffff';
            ctx.font = '700 82px Montserrat';
            ctx.shadowBlur = isMarking ? 40 : 15;
            ctx.shadowColor = isMarking ? '#fbbf24' : 'rgba(0,0,0,0.5)';
        } else {
            ctx.fillStyle = `rgba(255,255,255,${opacity * 0.2})`;
            ctx.font = '300 48px Montserrat';
            ctx.shadowBlur = 0;
        }
        ctx.fillText(lyricsLines[idx].toUpperCase(), listX, y);
    }
    ctx.restore();

    // 4. 動態電視噪點 (Cinematic Static)
    ctx.save();
    for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }
    ctx.restore();

    // 5. 官方身分證標記 (ISRC / UPC / Label)
    ctx.save();
    ctx.font = '700 16px Montserrat';
    ctx.letterSpacing = '10px';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    const metaY = canvas.height - 120;
    ctx.fillText(`${selectedSong.title.toUpperCase()} // OFFICIAL ARCHIVE`, listX, metaY - 35);
    
    ctx.font = '500 13px Montserrat';
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillText(`ISRC: ${selectedSong.isrc || 'UNKNOWN'} | UPC: ${selectedSong.upc || 'UNKNOWN'} | ℗ WILLWI MUSIC`, listX, metaY);
    ctx.restore();

    requestRef.current = requestAnimationFrame(drawFrame);
  }, [selectedSong, currentLineIndex, lyricsLines, isMarking]);

  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    recordedChunks.current = [];
    try {
        const stream = canvas.captureStream(30); 
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
          setVideoBlobUrl(URL.createObjectURL(blob));
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        requestRef.current = requestAnimationFrame(drawFrame);
    } catch (e) { requestRef.current = requestAnimationFrame(drawFrame); }
  };

  const handleCapture = useCallback(() => {
    if (isPaused || !audioRef.current || currentLineIndex >= lyricsLines.length) return;
    const time = audioRef.current.currentTime;
    const text = lyricsLines[currentLineIndex];
    
    setIsMarking(true);
    setTimeout(() => setIsMarking(false), 150);
    
    setTimestamps(prev => [...prev, { time, text }]);
    
    if (currentLineIndex < lyricsLines.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
    } else {
        handleFinish();
    }
  }, [isPaused, currentLineIndex, lyricsLines]);

  const handleTogglePlay = async (e?: any) => {
      if (e) e.stopPropagation();
      if (!audioRef.current) return;
      if (isPaused) {
          try {
              await audioRef.current.play();
              setIsPaused(false);
              if (timestamps.length === 0) startRecording();
          } catch (e) { showToast("Audio Playback Error", "error"); }
      } else {
          audioRef.current.pause();
          setIsPaused(false); // 在一擊必中邏輯下，Pause 其實是 Stop
      }
  };

  const handleFinish = async (e?: any) => {
      if (e) e.stopPropagation();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioRef.current) audioRef.current.pause();
      setMode('mastered');
  };

  const saveToSystem = async () => {
      if (!selectedSong || isSaving) return;
      setIsSaving(true);
      try {
          const lrcData = timestamps.map(ts => {
                const m = Math.floor(ts.time / 60).toString().padStart(2, '0');
                const s = (ts.time % 60).toFixed(2).padStart(5, '0');
                return `[${m}:${s}]${ts.text}`;
            }).join('\n');
          await updateSong(selectedSong.id, { lyrics: lrcData });
          showToast("對位數據已官方鎖定", "success");
          navigate('/database');
      } catch (err) { showToast("儲存失敗", "error"); } finally { setIsSaving(false); }
  };

  const formatTimeLrc = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toFixed(2).padStart(5, '0');
      return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen pt-20 pb-20 relative flex flex-col items-center justify-center px-6 bg-black overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} width="1920" height="1080" className="hidden" />

      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-black/95 z-10"></div>
          {selectedSong && (
              <img src={selectedSong.coverUrl} className="w-full h-full object-cover opacity-20 blur-[120px] scale-125" alt="" />
          )}
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center">
           
           {mode === 'intro' && (
               <div className="max-w-4xl mx-auto space-y-16 animate-fade-in-up flex flex-col items-center text-center">
                   <div className="space-y-8 flex flex-col items-center">
                       <h2 className="text-brand-gold font-medium tracking-[1em] text-[11px] ml-[1em]">一 次 性 儀 式</h2>
                       <p className="text-5xl md:text-7xl font-light tracking-[0.3em] text-white ml-[0.3em] font-serif">感 官 命 中 同 步</p>
                       <p className="text-[12px] text-slate-400 tracking-[0.4em] font-light max-w-lg leading-loose ml-[0.4em]">沒有第二次機會。音樂一響，您現在做的，就是最後的樣子。</p>
                   </div>

                   <button onClick={() => setMode(isSessionUnlocked() ? 'select' : 'unlock')} className="px-16 py-6 bg-brand-gold text-black text-[13px] font-medium tracking-[1em] hover:bg-white transition-all pl-[1em] mt-8">進 入 同 步 室</button>
               </div>
           )}

           {mode === 'unlock' && (
               <div className="max-w-md mx-auto space-y-12 animate-fade-in-up flex flex-col items-center text-center">
                   <div className="space-y-6">
                       <h2 className="text-brand-gold font-black uppercase tracking-[0.8em] text-[12px]">ACCESS REQUIRED</h2>
                       <p className="text-slate-300 font-light text-sm leading-loose tracking-[0.15em]">
                           請輸入一次性通行碼以進入手工對時環節。
                       </p>
                   </div>

                   <div className="w-full space-y-6">
                       <input 
                           type="text" 
                           value={unlockInput}
                           onChange={(e) => setUnlockInput(e.target.value)}
                           placeholder="ENTER CODE"
                           className="w-full bg-black/40 border-b-2 border-white/20 px-4 py-6 text-center text-2xl font-mono text-white tracking-[0.5em] focus:border-brand-gold outline-none transition-colors uppercase"
                       />
                       <button 
                           onClick={() => {
                               const correctCode = globalSettings.accessCode || '8888';
                               if (unlockInput === correctCode) {
                                   sessionStorage.setItem(STUDIO_SESSION_KEY, 'true');
                                   setMode('select');
                               } else {
                                   showToast("通行碼錯誤", "error");
                               }
                           }}
                           className="w-full py-6 bg-brand-gold text-black text-[11px] font-black uppercase tracking-[0.8em] hover:bg-white transition-all"
                       >
                           VERIFY CODE
                       </button>
                   </div>

                   <div className="pt-8 border-t border-white/10 w-full">
                       <p className="text-[10px] text-slate-500 font-light tracking-[0.15em] mb-6">
                           尚未取得通行碼？請加入官方 Line@ 獲取：
                       </p>
                       <a 
                           href="https://lin.ee/y96nuSM" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-block px-10 py-4 border border-brand-gold/30 text-brand-gold text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold/10 transition-all"
                       >
                           加入官方 LINE@
                       </a>
                   </div>
               </div>
           )}

           {mode === 'select' && (
               <div className="w-full space-y-12 animate-fade-in max-w-7xl mx-auto overflow-y-auto max-h-[75vh] custom-scrollbar px-6">
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                       {songs.map(s => (
                           <div key={s.id} className="group cursor-pointer" onClick={() => { setSelectedSong(s); setMode('playing'); }}>
                               <div className="aspect-square relative overflow-hidden bg-slate-900 border border-white/5 shadow-2xl mb-4">
                                   <img src={s.coverUrl} className="w-full h-full object-cover opacity-100 transition-all duration-700 group-hover:border-brand-gold/40" alt="" />
                               </div>
                               <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-widest truncate group-hover:text-brand-gold transition-all">{s.title}</h4>
                           </div>
                       ))}
                   </div>
               </div>
           )}

           {mode === 'playing' && selectedSong && (
               <div className="fixed inset-0 flex flex-col bg-black z-50 animate-fade-in">
                   {/* 頂部作品資訊 */}
                   <div className="w-full p-10 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur-md z-20">
                        <div className="flex items-center gap-6">
                            <img src={selectedSong.coverUrl} className="w-16 h-16 object-cover border border-white/10" />
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">{selectedSong.title}</h3>
                                <p className="text-[9px] text-brand-gold font-bold tracking-[0.6em] opacity-40 uppercase">Recording Protocol</p>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-end text-right max-w-sm">
                            <p className="text-[10px] text-brand-gold font-medium tracking-widest mb-1">【操作提示】</p>
                            <p className="text-[9px] text-slate-400 font-light tracking-widest leading-relaxed">
                                你不需要這首歌不會走<br/>
                                跟著它在你覺得「對了」的時候，按下往下鍵，放開會自動跳下一行<br/>
                                每一行歌詞，都需你親手放上去的你若覺得不需要按當然也可以。
                            </p>
                        </div>
                   </div>

                   {/* 對位清單 (對齊截圖風格) */}
                   <div 
                      ref={listRef}
                      className="flex-1 overflow-y-auto custom-scrollbar-hidden py-40 px-6 md:px-24 flex flex-col gap-6"
                   >
                        {lyricsLines.map((line, idx) => {
                            const ts = timestamps.find(t => t.text === line);
                            const isActive = idx === currentLineIndex;
                            const isDone = idx < currentLineIndex;
                            
                            return (
                                <div 
                                    key={idx}
                                    className={`flex items-center gap-6 p-6 transition-all duration-500 rounded-sm border ${
                                        isActive ? 'border-brand-gold bg-brand-gold/5 active-lyric scale-105 z-10 shadow-[0_0_30px_rgba(251,191,36,0.15)]' : 
                                        isDone ? 'border-white/5 opacity-40' : 'border-transparent opacity-10'
                                    }`}
                                >
                                    <div className="w-24 font-mono text-center">
                                        {isDone && ts ? (
                                            <span className="text-brand-gold text-xs">{formatTimeLrc(ts.time)}</span>
                                        ) : (
                                            <span className="text-slate-800 text-[10px] tracking-widest">--:--.--</span>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center">
                                         {isDone ? <span className="text-brand-gold text-[10px]">✔</span> : isActive ? <span className="text-white animate-pulse">▶</span> : null}
                                    </div>
                                    <p className={`flex-1 text-xl md:text-3xl font-thin tracking-widest uppercase ${isActive ? 'text-white' : 'text-slate-600'}`}>
                                        {line}
                                    </p>
                                </div>
                            );
                        })}
                   </div>

                   {/* 底部播放器與控制區 */}
                   <div className="w-full bg-black/80 backdrop-blur-xl border-t border-white/5 p-10 flex flex-col gap-8 pb-[env(safe-area-inset-bottom)]">
                        <div className="w-full h-2 bg-white/5 relative overflow-hidden">
                            <div className="h-full bg-brand-gold shadow-[0_0_20px_#fbbf24] transition-all duration-300" style={{ width: `${(progress / (duration || 1)) * 100}%` }}></div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex gap-4 items-center">
                                <button onClick={handleTogglePlay} className="w-20 h-20 bg-white text-black flex items-center justify-center hover:bg-brand-gold transition-all">
                                    {isPaused ? <span className="text-lg">▶</span> : <span className="text-xs font-black">STP</span>}
                                </button>
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest">ELAPSED</p>
                                    <p className="text-lg text-white font-mono">{formatTimeLrc(progress)}</p>
                                </div>
                            </div>

                            <div className="flex-1 flex justify-center gap-4">
                                <button 
                                    onClick={() => currentLineIndex > 0 && setCurrentLineIndex(p => p - 1)}
                                    className="px-14 py-8 bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                                >
                                    <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 15l7-7 7 7"/></svg>
                                </button>
                                <button 
                                    onClick={handleCapture}
                                    className="px-24 py-8 bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center group active:bg-brand-gold active:scale-95 transition-all"
                                >
                                    <svg className="w-10 h-10 text-brand-gold group-active:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7"/></svg>
                                </button>
                            </div>

                            <button onClick={handleFinish} className="px-10 py-8 border border-white/5 text-[10px] text-white/20 font-black uppercase tracking-widest hover:text-white transition-all">
                                Finish Session
                            </button>
                        </div>
                   </div>
               </div>
           )}

           {mode === 'mastered' && (
               <div className="text-center space-y-12 animate-fade-in-up flex flex-col items-center max-w-4xl mx-auto py-12 px-6">
                   <div className="space-y-4">
                        <h2 className="text-4xl md:text-6xl font-thin text-white uppercase tracking-tighter">聽 眾 同 步 完 成</h2>
                        <p className="text-brand-gold/40 uppercase tracking-[0.8em] font-black text-[10px]">CINEMATIC PROTOCOL DEPLOYED</p>
                   </div>
                   
                   <div className="space-y-6 text-slate-300 font-light text-sm leading-loose tracking-[0.15em] max-w-2xl">
                       <p>這不是一個完美的版本。<br/>這是一個屬於你的版本。<br/>你願意把它留下來真好。</p>
                   </div>

                   <div className="w-full bg-[#050a14] border border-white/5 p-6 md:p-12 space-y-10 shadow-2xl">
                       <div className="aspect-video w-full bg-black border border-white/5 overflow-hidden rounded-sm">
                           {videoBlobUrl ? (
                               <video src={videoBlobUrl} className="w-full h-full object-contain" controls />
                           ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                    <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[9px] text-slate-700 uppercase tracking-widest font-black animate-pulse">Encoding Certified Reel...</span>
                               </div>
                           )}
                       </div>
                       
                       <div className="text-left space-y-4 border-t border-white/5 pt-8">
                           <p className="text-brand-gold font-medium text-[11px] tracking-widest">【最後匯出成本】</p>
                           <p className="text-slate-400 font-light text-xs leading-loose tracking-[0.15em]">
                               我不打分數。我不比較。<br/>
                               每一個完成的版本，我都感謝。<br/>
                               謝謝你，願意坐下來陪一首歌。
                           </p>
                       </div>

                       <div className="flex flex-col md:flex-row gap-6 pt-4">
                           <button onClick={saveToSystem} disabled={isSaving} className="flex-1 py-7 bg-brand-gold text-black font-black uppercase text-[11px] tracking-[0.6em] hover:bg-white transition-all pl-[0.6em]">鎖定時間指紋並更新 Archive</button>
                           <button onClick={() => navigate('/database')} className="flex-1 py-7 border border-white/10 text-white/30 font-medium uppercase text-[11px] tracking-[0.6em] hover:text-white transition-all pl-[0.6em]">返回作品庫</button>
                       </div>
                   </div>
               </div>
           )}
      </div>
      <audio ref={audioRef} src={resolveDirectLink(selectedSong?.audioUrl || '') || undefined} crossOrigin="anonymous" onTimeUpdate={() => { if (audioRef.current) setProgress(audioRef.current.currentTime); }} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} />
    </div>
  );
}; export default Interactive;
