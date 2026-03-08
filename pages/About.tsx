
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { getLatestWillwiInfo } from '../services/geminiService';
import { CountdownTimer } from '../components/CountdownTimer';

const About: React.FC = () => {
  const { t } = useTranslation();
  const { globalSettings } = useData();
  const [latestInfo, setLatestInfo] = useState<{ text: string; sources?: { title: string; uri: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getLatestWillwiInfo();
        setLatestInfo(info);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const socialLinks = [
    { name: 'WEBSITE', url: globalSettings.link_website },
    { name: 'SPOTIFY', url: globalSettings.link_spotify },
    { name: 'APPLE MUSIC', url: globalSettings.link_apple },
    { name: 'YOUTUBE', url: globalSettings.link_youtube },
    { name: 'TIDAL', url: globalSettings.link_tidal },
  ];

  // Helper to extract YouTube video ID
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeVideoId = globalSettings.youtubeVideoUrl ? getYoutubeVideoId(globalSettings.youtubeVideoUrl) : null;

  return (
    <div className="min-h-screen bg-transparent text-slate-200 pt-32 pb-40 px-6 animate-fade-in relative overflow-hidden flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto relative z-10 text-center space-y-32">
        
        {/* Countdown & Video Section */}
        {(globalSettings.countdownTargetDate || youtubeVideoId) && (
          <div className="space-y-16">
            {globalSettings.countdownTargetDate && (
              <div className="animate-fade-in-up">
                <CountdownTimer targetDate={globalSettings.countdownTargetDate} />
              </div>
            )}
            
            {youtubeVideoId && (
              <div className="w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full object-cover"
                ></iframe>
              </div>
            )}
          </div>
        )}

        {/* AI Latest Info Section */}
        <div className="relative max-w-2xl mx-auto mt-24 mb-24 p-8 md:p-12 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-3 text-brand-gold/80">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">即時動態</span>
                </div>
                
                <div className="min-h-[100px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-4 h-4 rounded-full border-2 border-brand-gold/30 border-t-brand-gold animate-spin"></div>
                            <span className="text-[10px] text-white/40 tracking-widest uppercase">正在同步宇宙訊號...</span>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <p className="text-sm md:text-base font-light text-white/70 tracking-[0.15em] leading-loose text-justify md:text-center">
                                {latestInfo?.text}
                            </p>
                            {latestInfo?.sources && latestInfo.sources.length > 0 && (
                                <div className="pt-6 border-t border-white/5 flex flex-wrap justify-center gap-4">
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest w-full mb-2">資料來源</span>
                                    {latestInfo.sources.slice(0, 3).map((source, idx) => (
                                        <a 
                                            key={idx} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[10px] text-brand-gold/60 hover:text-brand-gold transition-colors truncate max-w-[150px] border border-brand-gold/20 rounded-full px-3 py-1"
                                        >
                                            {source.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-12">
            <span className="text-slate-600 font-bold uppercase tracking-[0.5em] text-[10px] block">關注我們的動態</span>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                {socialLinks.map(channel => (
                    <a 
                      key={channel.name} 
                      href={channel.url && channel.url !== '#' ? channel.url : undefined} 
                      target="_blank"
                      rel="noreferrer"
                      className={`text-[11px] font-medium uppercase tracking-[0.25em] transition-all duration-300 ${
                        channel.url && channel.url !== '#' 
                        ? 'text-white/60 hover:text-brand-gold hover:scale-110' 
                        : 'text-white/20 cursor-not-allowed'
                      }`}
                    >
                      {channel.name}
                    </a>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default About;
