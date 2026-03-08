
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Song, ProjectType, Language, ReleaseCategory } from '../types';
import { getArtistAlbums, getSpotifyAlbumTracks, getSpotifyAlbum, SpotifyAlbum, SpotifyTrack } from '../services/spotifyService';
import { useToast } from '../context/ToastContext';

const WILLWI_SPOTIFY_ID = '3ascZ8Rb2KDw4QyCy29Om4';

const getYTId = (url: string) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const getYTPlaylistId = (url: string) => {
    if (!url) return null;
    const match = url.match(/[?&]list=([^#&?]+)/);
    return match ? match[1] : null;
};

const Streaming: React.FC = () => {
  const { songs, globalSettings, playSong, currentSong, isPlaying } = useData();
  const { showToast } = useToast();
  const [albums, setAlbums] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [albumTracks, setAlbumTracks] = useState<SpotifyTrack[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    const fetchDiscography = async () => {
      setIsLoading(true);
      const officialAlbums = await getArtistAlbums(WILLWI_SPOTIFY_ID);
      if (officialAlbums.length > 0) setAlbums(officialAlbums);
      setIsLoading(false);
    };
    fetchDiscography();
  }, []);

  const handleAlbumClick = async (albumId: string) => {
    setIsDetailLoading(true);
    const baseAlbum = albums.find(a => a.id === albumId);
    setSelectedAlbum(baseAlbum || null);
    setAlbumTracks([]); 
    
    try {
      const [fullAlbum, tracks] = await Promise.all([
        getSpotifyAlbum(albumId),
        getSpotifyAlbumTracks(albumId)
      ]);
      if (fullAlbum) setSelectedAlbum(fullAlbum);
      setAlbumTracks(tracks);
    } catch (e) {
      console.error("Failed to load album details", e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const findMatchingInternalSong = (trackName: string) => {
      return songs.find(s => s.title.toLowerCase().includes(trackName.toLowerCase()) && s.audioUrl);
  };

  const handlePlayTrack = (trackName: string) => {
      const internalSong = findMatchingInternalSong(trackName);
      if (internalSong) {
          playSong(internalSong);
          showToast(`已匹配內部高品質音軌，正在播放完整版：${internalSong.title}`, "success");
      } else {
          showToast("此音軌僅供預覽，完整版請至作品庫或 Spotify 收聽。", "info");
      }
  };

  const playlistId = useMemo(() => getYTPlaylistId(globalSettings.youtubePlaylistUrl || ''), [globalSettings.youtubePlaylistUrl]);

  return (
    <div className="min-h-screen pt-32 pb-60 px-6 md:px-24 animate-fade-in bg-black overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
        
        {/* 頂部標題 */}
        <div className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.8em] border-l border-brand-gold pl-4">OFFICIAL CHANNELS</span>
                <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-gold/20 animate-pulse">Master Playlist Hub</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-light text-white tracking-tighter uppercase leading-none">串流媒體</h2>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
              <a href={globalSettings.youtubePlaylistUrl} target="_blank" rel="noreferrer" className="flex-1 md:flex-none px-10 py-5 bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-200 text-center rounded-sm">YOUTUBE 音樂</a>
              <a href={`https://open.spotify.com/artist/${WILLWI_SPOTIFY_ID}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none px-10 py-5 bg-[#1DB954] text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all duration-200 text-center rounded-sm">SPOTIFY</a>
          </div>
        </div>

        {/* 官方播放清單嵌入 */}
        {playlistId && (
            <div className="mb-32 group">
                <div className="relative bg-[#050a14] border border-white/5 p-2 rounded-sm overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                    <div className="absolute top-8 left-8 z-10 flex items-center gap-4 pointer-events-none">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Official Sequence</span>
                    </div>
                    <div className="aspect-video w-full rounded-sm overflow-hidden">
                         <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen className="transition-all duration-300"></iframe>
                    </div>
                </div>
            </div>
        )}

        <div className="mb-32">
            <div className="flex items-center justify-between border-b border-white/5 pb-10 mb-16">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.6em]">SPOTIFY DISCOGRAPHY ({albums.length})</h3>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-16">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="space-y-4 animate-pulse">
                            <div className="aspect-square bg-white/[0.03] rounded-sm"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-10 gap-y-24">
                    {albums.map(album => (
                        <div key={album.id} onClick={() => handleAlbumClick(album.id)} className="group cursor-pointer relative">
                            <div className="aspect-square bg-slate-900 border border-white/5 overflow-hidden shadow-2xl rounded-sm transition-all duration-300 group-hover:border-white/20">
                                <img src={album.images?.[0]?.url || undefined} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-200">
                                        <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 space-y-2">
                                <h4 className="text-[13px] font-medium text-white uppercase truncate tracking-widest group-hover:text-brand-gold transition-colors duration-200">{album.name}</h4>
                                <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase flex items-center gap-2">
                                    {album.album_type} <span className="w-1 h-1 bg-slate-800 rounded-full"></span> {album.release_date.split('-')[0]}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {selectedAlbum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-10 animate-fade-in">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setSelectedAlbum(null)}></div>
          <div className="relative z-10 w-full max-w-4xl h-full bg-slate-950 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col animate-fade-in-right">
            <div className="p-12 border-b border-white/5 flex flex-col md:flex-row gap-12 bg-white/[0.01]">
                <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 shadow-2xl relative group">
                    <img src={selectedAlbum.images?.[0]?.url || undefined} className="w-full h-full object-cover border border-white/10" alt="" />
                </div>
                <div className="flex flex-col justify-end space-y-4">
                    <span className="text-[10px] text-brand-gold font-bold uppercase tracking-[0.8em]">{selectedAlbum.album_type}</span>
                    <h3 className="text-4xl md:text-5xl font-light text-white uppercase tracking-tighter leading-tight">{selectedAlbum.name}</h3>
                </div>
                <button onClick={() => setSelectedAlbum(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors p-4">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-2 custom-scrollbar bg-black/40">
                {albumTracks.map((track, idx) => {
                    const internalSong = findMatchingInternalSong(track.name);
                    const isCurrentlyPlaying = currentSong?.id === internalSong?.id && isPlaying;
                    
                    return (
                        <div key={track.id} 
                             onClick={() => handlePlayTrack(track.name)}
                             className={`grid grid-cols-12 gap-4 px-6 py-8 items-center group transition-all duration-200 hover:bg-white/5 border-b border-white/[0.02] cursor-pointer ${isCurrentlyPlaying ? 'bg-brand-gold/10' : ''}`}>
                            <div className="col-span-1 text-center text-[10px] font-mono text-slate-700">
                                {isCurrentlyPlaying ? <span className="text-brand-gold">▶</span> : idx + 1}
                            </div>
                            <div className="col-span-11 flex justify-between items-center">
                                <div>
                                    <p className={`text-sm font-medium uppercase tracking-widest transition-colors duration-200 ${isCurrentlyPlaying ? 'text-brand-gold' : 'text-white group-hover:text-brand-gold'}`}>
                                        {track.name}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in-right { animation: fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}; export default Streaming;
