
import React, { useMemo } from 'react';
import { useData, resolveDirectLink } from '../context/DataContext';

const CosmosParticles: React.FC = () => {
  const { globalSettings } = useData();
  
  const videoUrl = useMemo(() => {
    return resolveDirectLink(globalSettings.backgroundVideoUrl || '');
  }, [globalSettings.backgroundVideoUrl]);

  const bgImageUrl = useMemo(() => {
    return resolveDirectLink(globalSettings.backgroundImageUrl || '');
  }, [globalSettings.backgroundImageUrl]);

  const stars = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2.2 + 0.4, 
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      twinkleDuration: `${Math.random() * 5 + 3}s`,
      twinkleDelay: `${Math.random() * 8}s`,
      driftDuration: `${Math.random() * 150 + 80}s`,
      opacity: Math.random() * 0.6 + 0.2,
      isGold: Math.random() > 0.95,
      blur: Math.random() > 0.9 ? '1px' : '0px'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-black">
      
      {/* 動態影片背景 */}
      {videoUrl ? (
        <video 
          key={videoUrl}
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : bgImageUrl ? (
        /* 靜態背景圖檔 */
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${bgImageUrl})` }}
        />
      ) : (
        /* 預設星空漸層與絲滑宇宙光暈 (Silky Cosmic Halo) */
        <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#050a14] to-black"></div>
            <div className="absolute inset-0 opacity-40 mix-blend-screen">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-gold/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
            </div>
        </>
      )}
      
      {/* 渲染強化後的星星 */}
      <div className="absolute inset-0">
          {stars.map(s => (
            <div
              key={s.id}
              className="absolute rounded-full"
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                left: s.left,
                top: s.top,
                backgroundColor: s.isGold ? '#fbbf24' : '#ffffff',
                boxShadow: s.isGold ? '0 0 10px #fbbf24, 0 0 20px rgba(251,191,36,0.3)' : '0 0 6px rgba(255,255,255,0.4)',
                filter: `blur(${s.blur})`,
                animation: `twinkle ${s.twinkleDuration} ease-in-out ${s.twinkleDelay} infinite, floatSlow ${s.driftDuration} linear infinite`,
                opacity: s.opacity,
              }}
            />
          ))}
      </div>
      
      {/* 暗部漸層 */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black"></div>
      
      <style>{`
        .bg-radial-gradient {
            background-image: radial-gradient(circle at center, transparent, rgba(0,0,0,0.6));
        }
      `}</style>
    </div>
  );
};

export default CosmosParticles;
