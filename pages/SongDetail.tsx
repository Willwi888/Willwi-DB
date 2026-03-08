
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Song } from '../types';
import { useToast } from '../context/ToastContext';

const SongDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSong, playSong, currentSong, isPlaying } = useData(); 
  const { isAdmin } = useUser(); 
  const { showToast } = useToast();
  
  const [song, setSong] = useState<Song | undefined>(undefined);

  useEffect(() => {
    if (id) {
      const found = getSong(id);
      if (found) setSong(found);
    }
  }, [id, getSong]);

  const spotifyId = useMemo(() => {
      const link = song?.spotifyLink || '';
      const match = link.match(/track\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
  }, [song]);

  if (!song) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-10">
        <div className="w-12 h-12 border border-brand-gold/10 border-t-brand-gold/40 rounded-full animate-spin"></div>
        <p className="text-[9px] text-brand-gold/20 font-thin uppercase tracking-[1em]">Accessing Protocol</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-60 pt-48 px-10 md:px-32 animate-fade-in relative bg-black">
        <div className="fixed inset-0 z-[-1] opacity-10 pointer-events-none" style={{ backgroundImage: `url(${song.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(200px) scale(2)' }}></div>
        
        <div className="max-w-[1600px] mx-auto">
            <div className="mb-32 flex flex-col md:flex-row justify-between items-center gap-16">
                <Link to="/database" className="text-[9px] text-white/10 hover:text-white/60 uppercase tracking-[0.8em] transition-all flex items-center gap-12 group">
                    <span className="w-20 h-[1px] bg-white/[0.03] group-hover:w-32 group-hover:bg-brand-gold/20 transition-all"></span> Return Catalog
                </Link>
                <div className="flex items-center gap-8">
                    {isAdmin && (
                        <button onClick={() => navigate(`/add?edit=${song.id}`)} className="px-10 py-4 text-[9px] font-thin uppercase tracking-[0.6em] bg-white/[0.02] text-white/30 hover:text-white border border-white/5 transition-all">
                            Edit Master
                        </button>
                    )}
                    {song.audioUrl && (
                        <button onClick={() => playSong(song)} className={`px-16 py-5 text-[10px] font-thin uppercase tracking-[0.6em] transition-all ${currentSong?.id === song.id && isPlaying ? 'bg-white text-black' : 'bg-brand-gold/60 text-black hover:bg-white hover:text-black shadow-2xl pl-[0.6em]'}`}>
                            {currentSong?.id === song.id && isPlaying ? 'Monitoring...' : 'Monitor Track'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-32">
                <div className="lg:col-span-4 space-y-24">
                    <div className="relative group border border-white/5">
                        <img src={song.coverUrl || undefined} className="w-full aspect-square object-cover transition-all duration-[3s]" />
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 p-16 space-y-12">
                         <h4 className="text-[9px] text-brand-gold/30 font-thin uppercase tracking-[1em] flex items-center gap-6">
                             Protocol
                             <span className="h-[1px] flex-1 bg-white/[0.03]"></span>
                         </h4>
                         <div className="grid grid-cols-1 gap-12 text-[9px] font-mono tracking-widest uppercase">
                             <div className="space-y-3"><p className="text-slate-800 tracking-[0.4em]">ISRC ID</p><p className="text-white/40 truncate">{song.isrc || 'N/A'}</p></div>
                             <div className="space-y-3"><p className="text-slate-800 tracking-[0.4em]">Barcode</p><p className="text-white/40 truncate">{song.upc || 'N/A'}</p></div>
                             <div className="space-y-3"><p className="text-slate-800 tracking-[0.4em]">Publication</p><p className="text-white/40">{song.releaseDate}</p></div>
                         </div>
                    </div>

                    {spotifyId && (
                        <div className="opacity-40 hover:opacity-100 transition-opacity duration-1000">
                            <iframe style={{ borderRadius: '0px' }} src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8 space-y-48">
                    <div className="space-y-10">
                        <span className="px-5 py-2 border border-brand-gold/10 text-brand-gold/40 text-[8px] font-thin uppercase tracking-[0.8em] inline-block">{song.releaseCategory || 'Master Single'}</span>
                        <h1 className="text-7xl md:text-9xl font-thin text-white uppercase tracking-tighter leading-none opacity-90">{song.title}</h1>
                        <p className="text-[11px] text-slate-800 font-medium uppercase tracking-[1em] pt-8">℗ {song.releaseCompany || 'Willwi Music Archive'}</p>
                    </div>

                    <div className="space-y-60 pb-40">
                        <div className="space-y-32">
                            <h3 className="text-[9px] font-thin text-brand-gold/20 uppercase tracking-[1.5em] flex items-center gap-12">
                                Manuscript
                                <span className="h-[1px] flex-1 bg-white/[0.03]"></span>
                            </h3>
                            <div className="text-3xl md:text-6xl font-thin text-white/50 leading-[2.4] uppercase tracking-[0.05em] whitespace-pre-line animate-fade-in transition-all hover:text-white/80 duration-1000">
                                {song.lyrics ? song.lyrics.replace(/\[\d+:\d+\.\d+\]/g, '') : '[ DATA PENDING ]'}
                            </div>
                        </div>

                        {song.credits && (
                            <div className="pt-32 border-t border-white/5">
                                <h3 className="text-[9px] font-thin text-slate-800 uppercase tracking-[1.2em] mb-20">Consolidated Credits</h3>
                                <div className="text-[10px] text-slate-600 font-thin leading-[3] tracking-[0.3em] whitespace-pre-line uppercase p-16 bg-white/[0.01] border border-white/5">
                                    {song.credits}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}; export default SongDetail;
