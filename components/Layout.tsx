
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { useData, resolveDirectLink } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import ChatWidget from './ChatWidget';
import CosmosParticles from './Snowfall';
import GlobalPlayer from './GlobalPlayer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, lang, setLang } = useTranslation();
  const { isAdmin } = useUser();
  const { globalSettings } = useData();
  const { showToast } = useToast();
  
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const toggleBgm = () => {
    if (!bgmRef.current) return;
    if (isBgmPlaying) {
      bgmRef.current.pause();
    } else {
      bgmRef.current.play().catch(() => showToast("點擊頁面以啟用背景音訊", "info"));
    }
    setIsBgmPlaying(!isBgmPlaying);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  const isActive = (path: string) => location.pathname === path 
    ? "text-white font-bold tracking-[0.25em] relative after:content-[''] after:absolute after:-bottom-4 after:left-0 after:w-full after:h-[1px] after:bg-brand-gold after:shadow-[0_0_10px_#fbbf24]" 
    : "text-slate-500 hover:text-white transition-all duration-300 font-medium tracking-[0.2em]";

  return (
    <div className="min-h-screen flex flex-col relative font-sans text-slate-100 bg-black">
      
      <CosmosParticles />

      {/* 頂部導覽列 - 強化分頁感 */}
      <nav className={`fixed w-full top-0 z-[100] transition-all duration-500 ${scrolled || !isHome ? 'bg-black/95 backdrop-blur-3xl border-b border-white/5 py-3' : 'bg-transparent py-10'}`}>
        <div className="max-w-[1440px] mx-auto px-8 md:px-12">
          <div className="flex items-center justify-between h-16">
            
            <Link to="/" className="group flex items-center gap-5">
              <span className="text-2xl font-black tracking-[0.25em] text-white uppercase group-hover:text-brand-gold transition-all duration-300">
                  Willwi
              </span>
              <div className="h-4 w-[1px] bg-white/10 group-hover:bg-brand-gold/30 transition-all"></div>
              <span className="text-[9px] text-white/20 tracking-[0.4em] font-black uppercase group-hover:text-white transition-all">
                  Studio
              </span>
            </Link>

            {/* 主選單分頁 (md 以上顯示) */}
            <div className="hidden md:flex items-center space-x-12 text-[10px] uppercase font-bold tracking-[0.2em] pt-1">
              <Link to="/" className={isActive('/')}>{t('nav_home')}</Link>
              <Link to="/database" className={isActive('/database')}>{t('nav_catalog')}</Link>
              <Link to="/interactive" className={isActive('/interactive')}>{t('nav_interactive')}</Link>
              <Link to="/streaming" className={isActive('/streaming')}>{t('nav_streaming')}</Link>
              <Link to="/about" className={isActive('/about')}>{t('nav_about')}</Link>
              <Link to="/guestbook" className={isActive('/guestbook')}>{t('nav_guestbook')}</Link>
              <Link to="/admin" className={isActive('/admin')}>{t('nav_admin')}</Link>
            </div>

            <div className="flex items-center gap-10">
                <button 
                  onClick={toggleBgm}
                  className="hidden md:flex items-center gap-4 group"
                >
                  <div className="flex gap-1 items-end h-3">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-0.5 bg-brand-gold transition-all duration-300 ${isBgmPlaying ? 'animate-pulse' : 'h-1'}`}
                        style={{ height: isBgmPlaying ? `${Math.random() * 100}%` : '4px', animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.3em] group-hover:text-white transition-colors">
                    Ambient
                  </span>
                </button>

                <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="text-[9px] font-black text-white/30 border border-white/10 px-5 py-2 hover:border-white/40 hover:text-white transition-all rounded-[2px] tracking-widest">
                  {lang === 'en' ? 'CH' : 'EN'}
                </button>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-black/98 backdrop-blur-2xl absolute w-full top-full py-16 px-12 flex flex-col gap-8 animate-fade-in text-[11px] tracking-[0.3em] uppercase border-t border-white/5 shadow-2xl">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/database" onClick={() => setIsMenuOpen(false)}>Catalog</Link>
              <Link to="/interactive" onClick={() => setIsMenuOpen(false)}>Studio</Link>
              <Link to="/guestbook" onClick={() => setIsMenuOpen(false)}>Guestbook</Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Console</Link>
          </div>
        )}
      </nav>

      <main className="flex-grow z-10 relative bg-transparent pt-32 lg:pt-40">
        {children}
      </main>

      <footer className="z-10 relative py-12 flex flex-col items-center justify-center border-t border-white/5 bg-black/40 backdrop-blur-md">
        <p className="text-[8px] text-white/10 font-black uppercase tracking-[0.8em]">
          © 2025 Willwi Music. Master Access Authorized.
        </p>
      </footer>
      
      <ChatWidget />
      <GlobalPlayer />
      
      <audio 
        ref={bgmRef} 
        src={resolveDirectLink(globalSettings.bgmUrl || '') || undefined} 
        loop 
        crossOrigin="anonymous" 
      />
    </div>
  );
};

export default Layout;
