
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Language, Song } from '../types';
import { useToast } from '../context/ToastContext';

interface AlbumGroup {
  upc: string;
  title: string;
  coverUrl: string;
  releaseDate: string;
  releaseCompany: string;
  songs: Song[];
}

const Database: React.FC = () => {
  const { songs, playSong } = useData();
  const { isAdmin } = useUser();
  const navigate = useNavigate();
  // Fixed: Corrected the declaration to avoid using 'showToast' before it is defined.
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLang, setFilterLang] = useState<string>('All');
  const [focusedAlbum, setFocusedAlbum] = useState<AlbumGroup | null>(null);

  const grouped = useMemo(() => {
    const filtered = songs.filter(song => {
      const matchSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          song.isrc?.includes(searchTerm) || 
                          song.upc?.includes(searchTerm);
      const matchLang = filterLang === 'All' || song.language === filterLang;
      return matchSearch && matchLang;
    });

    const m = new Map<string, AlbumGroup>();
    filtered.forEach(song => {
      const key = song.upc || `SINGLE_${song.id}`;
      if (!m.has(key)) {
          m.set(key, { 
              upc: song.upc || 'N/A', 
              title: song.title.split(' - ')[0], 
              coverUrl: song.coverUrl, 
              releaseDate: song.releaseDate, 
              releaseCompany: song.releaseCompany || 'Willwi Music', 
              songs: [] 
          });
      }
      m.get(key)!.songs.push(song);
    });

    m.forEach(album => {
        album.songs.sort((a, b) => (a.trackNumber || 1) - (b.trackNumber || 1));
    });

    return Array.from(m.values()).sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
  }, [songs, searchTerm, filterLang]);

  return (
    <>
      <div className={`min-h-screen transition-all duration-500 ${focusedAlbum ? 'blur-3xl brightness-[0.4]' : ''}`}>
        <div className="max-w-[1440px] mx-auto px-8 md:px-16 pt-24 pb-60">
          
          <div className="mb-32 space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-8">
                  <span className="h-[1px] w-12 bg-brand-gold/20"></span>
                  <span className="text-[9px] font-black text-brand-gold/40 uppercase tracking-[1em]">Authorized Archive</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-thin text-white tracking-tighter uppercase leading-none opacity-90">Catalog</h2>
          </div>

          <div className="flex flex-col gap-12 mb-24 animate-fade-in-up [animation-delay:0.1s]">
            {/* 搜尋框 */}
            <input 
              className="w-full bg-transparent border-b border-white/5 py-8 text-white text-base font-thin outline-none focus:border-brand-gold/30 transition-all duration-300 tracking-[0.3em] placeholder:text-slate-900" 
              placeholder="SEARCH ARCHIVE / ISRC / UPC" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
            
            {/* 語言分頁標籤 (Tabs) */}
            <div className="flex flex-wrap gap-x-12 gap-y-6 pt-4">
                <button 
                  onClick={() => setFilterLang('All')}
                  className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-300 relative pb-2 ${filterLang === 'All' ? 'text-brand-gold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-brand-gold' : 'text-slate-700 hover:text-white/60'}`}
                >
                  All Modalities
                </button>
                {Object.values(Language).map(l => (
                  <button 
                    key={l}
                    onClick={() => setFilterLang(l)}
                    className={`text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-300 relative pb-2 ${filterLang === l ? 'text-brand-gold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-brand-gold' : 'text-slate-700 hover:text-white/60'}`}
                  >
                    {l}
                  </button>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-20 animate-fade-in-up [animation-delay:0.2s]">
              {grouped.map((album) => (
                  <div key={album.upc + album.title} onClick={() => setFocusedAlbum(album)} className="group cursor-pointer">
                      <div className="aspect-square bg-black border border-white/5 overflow-hidden transition-all duration-500 group-hover:border-brand-gold/20 relative">
                          <img src={album.coverUrl || undefined} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-100" alt={album.title} />
                          <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                              <span className="text-[7px] text-brand-gold/60 font-black uppercase tracking-[0.6em] mb-4">Master View</span>
                              <h3 className="text-sm font-medium text-white uppercase tracking-[0.3em] leading-tight">{album.title}</h3>
                          </div>
                      </div>
                      <div className="mt-6 space-y-2 px-1">
                          <div className="flex justify-between items-center">
                              <p className="text-[8px] text-slate-800 font-mono tracking-[0.4em]">{album.releaseDate.split('-')[0]}</p>
                              <p className="text-[7px] text-brand-gold/20 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">BARCODE:{album.upc}</p>
                          </div>
                          <h4 className="text-[11px] font-medium text-white/30 uppercase tracking-[0.3em] truncate group-hover:text-white transition-colors">{album.title}</h4>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {focusedAlbum && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 animate-fade-in">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setFocusedAlbum(null)}></div>
            <div className="relative w-full max-w-6xl h-[90vh] overflow-hidden bg-black border border-white/5 flex flex-col md:flex-row shadow-[0_60px_150px_rgba(0,0,0,1)]">
                <div className="w-full md:w-[400px] shrink-0 bg-[#050a14] flex flex-col items-center justify-center p-12 md:p-20 border-r border-white/5">
                    <div className="w-full aspect-square relative shadow-2xl mb-12 overflow-hidden border border-white/5">
                        <img src={focusedAlbum.coverUrl || undefined} className="w-full h-full object-cover" alt={focusedAlbum.title} />
                    </div>
                    <div className="text-center space-y-6 w-full">
                        <h2 className="text-2xl font-light text-white uppercase tracking-[0.3em] leading-tight">{focusedAlbum.title}</h2>
                        <div className="space-y-2 pt-2">
                             <p className="text-[8px] text-brand-gold/40 font-black uppercase tracking-[0.6em]">{focusedAlbum.releaseDate}</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-12">
                            {isAdmin && (
                                <button onClick={() => navigate(`/add?edit=${focusedAlbum.songs[0]?.id}`)} className="w-full px-10 py-4 border border-brand-gold/30 text-[8px] font-black text-brand-gold hover:bg-brand-gold hover:text-black uppercase tracking-[0.6em] transition-all">Edit Album</button>
                            )}
                            <button onClick={() => setFocusedAlbum(null)} className="w-full px-10 py-4 border border-white/10 text-[8px] font-black text-white/20 hover:text-white uppercase tracking-[0.6em] transition-all">Close Entry</button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col p-10 md:p-20 overflow-y-auto custom-scrollbar bg-black">
                    <div className="space-y-2">
                        {focusedAlbum.songs.map((s, i) => (
                            <div key={s.id} className="group flex items-center justify-between py-6 border-b border-white/[0.02] hover:bg-white/[0.01] px-6 transition-all cursor-pointer" onClick={() => navigate(`/song/${s.id}`)}>
                                <div className="flex items-center gap-10">
                                    <span className="text-[10px] font-mono text-slate-800">{(i+1).toString().padStart(2, '0')}</span>
                                    <h4 className="text-xl font-thin text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{s.title}</h4>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/add?edit=${s.id}`); }} className="px-4 py-2 border border-white/5 rounded-full flex items-center justify-center text-[8px] text-white/30 hover:bg-white hover:text-black uppercase tracking-widest transition-all">
                                            Edit
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); playSong(s); }} className="w-10 h-10 border border-white/5 rounded-full flex items-center justify-center text-white/10 hover:bg-white hover:text-black transition-all">
                                        <span className="text-[8px] ml-0.5">▶</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
}; export default Database;
