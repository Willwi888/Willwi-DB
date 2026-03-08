
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData, resolveDirectLink } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { Language, ProjectType, ReleaseCategory, Song } from '../types';
import { STANDARD_CREDITS } from '../context/InitialData';
import { 
    searchSpotifyTracks, 
    searchSpotifyAlbums,
    getSpotifyAlbum
} from '../services/spotifyService';
import { useToast } from '../context/ToastContext';

const AddSong: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useUser();
  const { addSong, updateSong, getSong } = useData();
  const { showToast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const editId = queryParams.get('edit');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Song>>({
    title: '',
    trackNumber: 1,
    language: Language.Mandarin,
    projectType: ProjectType.Indie,
    releaseCategory: ReleaseCategory.Single,
    releaseDate: new Date().toISOString().split('T')[0],
    coverUrl: '',
    lyrics: '',
    audioUrl: '',
    isrc: '',
    upc: '',
    spotifyLink: '',
    youtubeUrl: '',
    credits: STANDARD_CREDITS,
    isInteractiveActive: true
  });

  useEffect(() => {
    if (!isAdmin) navigate('/admin');
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (editId) {
      const existing = getSong(editId);
      if (existing) setFormData({ ...existing });
    }
  }, [editId, getSong]);

  const spotifyId = useMemo(() => {
    const link = formData.spotifyLink || '';
    const match = link.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }, [formData.spotifyLink]);

  const handleSearch = async () => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      try {
          const [trackRes, albumRes] = await Promise.all([
              searchSpotifyTracks(searchQuery),
              searchSpotifyAlbums(searchQuery)
          ]);
          setSearchResults([
              ...albumRes.map((a: any) => ({ ...a, searchType: 'album' })),
              ...trackRes.map((t: any) => ({ ...t, searchType: 'track' }))
          ]);
      } catch (e) { showToast("搜尋失敗"); } finally { setIsSearching(false); }
  };

  const handleImportSpotify = async (track: any) => {
    showToast(`正在導入 ${track.name}...`);
    let upc = '';
    let label = '';
    if (track.album?.id) {
        const fullAlbum = await getSpotifyAlbum(track.album.id);
        if (fullAlbum) {
            upc = fullAlbum.external_ids?.upc || '';
            label = fullAlbum.label || '';
        }
    }
    setFormData(prev => ({
      ...prev,
      title: track.name,
      trackNumber: track.track_number || 1,
      isrc: track.external_ids?.isrc || prev.isrc,
      upc: upc || prev.upc,
      coverUrl: track.album?.images?.[0]?.url || prev.coverUrl,
      releaseDate: track.album?.release_date || prev.releaseDate,
      spotifyLink: track.external_urls?.spotify || prev.spotifyLink,
      releaseCompany: label || prev.releaseCompany
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'trackNumber' ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return showToast("作品標題為必填", "error");
    setIsSubmitting(true);
    const success = editId ? await updateSong(editId, formData) : await addSong(formData as Song);
    if (success) {
        showToast("母帶資料存檔成功", "success");
        navigate('/admin');
    } else { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-black pb-60 pt-16 px-6 md:px-20 animate-fade-in">
        <div className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* 左側：導入與預覽器 (對齊截圖左欄) */}
            <div className="lg:col-span-4 space-y-10">
                <div className="bg-slate-950/80 border border-white/5 p-8 rounded-sm shadow-2xl">
                    <h3 className="text-[11px] font-black text-brand-gold uppercase tracking-[0.4em] mb-6">快速導入作品</h3>
                    <div className="flex gap-2 mb-6">
                        <div className="flex bg-black border border-white/10 overflow-hidden flex-1">
                             <div className="bg-emerald-600 px-3 flex items-center"><span className="text-[8px] font-black text-white">SPOTIFY</span></div>
                             <input className="flex-1 bg-transparent p-4 text-white text-xs outline-none focus:bg-white/5 transition-all" placeholder="搜尋曲目或專輯..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <button onClick={handleSearch} className="px-8 bg-white text-black text-[10px] font-black uppercase hover:bg-brand-gold transition-all">去</button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.map(res => (
                            <div key={res.id} onClick={() => handleImportSpotify(res)} className="flex items-center gap-4 p-3 bg-white/[0.03] border border-white/5 hover:border-brand-gold cursor-pointer transition-all group">
                                <img src={res.images?.[0]?.url || res.album?.images?.[0]?.url || ''} className="w-10 h-10 object-cover" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[11px] text-white font-bold truncate group-hover:text-brand-gold">{res.name}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">{res.searchType}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="aspect-square bg-slate-900 border border-white/10 overflow-hidden relative shadow-2xl">
                        {formData.coverUrl ? (
                            <img src={formData.coverUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-slate-700 uppercase tracking-[0.4em]">No Artwork</div>
                        )}
                    </div>
                    
                    {/* Spotify 播放器即時預覽 - 讓你邊填資料邊聽歌 */}
                    {spotifyId && (
                         <div className="animate-fade-in border border-white/10">
                            <iframe style={{ borderRadius: '0px' }} src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`} width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                         </div>
                    )}
                </div>
            </div>

            {/* 右側：權威資料表單 (對齊截圖右欄) */}
            <div className="lg:col-span-8 bg-[#050a14] border border-white/5 p-12 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                <form onSubmit={handleSubmit} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">作品名稱 (TITLE)</label>
                            <input name="title" value={formData.title || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">版本標籤 (VERSION LABEL)</label>
                            <input name="versionLabel" value={formData.versionLabel || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all" placeholder="e.g. Radio Edit, Live" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">軌目編號 (TRACK #)</label>
                            <input type="number" name="trackNumber" value={formData.trackNumber || 1} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold font-mono" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">發行者 (PUBLISHER)</label>
                            <input name="publisher" value={formData.publisher || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all" placeholder="Publisher Name" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">ISRC 編碼</label>
                            <input name="isrc" value={formData.isrc || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold font-mono" placeholder="QZES6..." />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">發行日期 (RELEASE DATE)</label>
                            <input type="date" name="releaseDate" value={formData.releaseDate || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold transition-all" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">UPC 編碼</label>
                            <input name="upc" value={formData.upc || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold font-mono" placeholder="8215..." />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">母帶音軌 URL (DROPBOX/DIRECT)</label>
                            <input name="audioUrl" value={formData.audioUrl || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold font-mono" placeholder="https://..." />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">SPOTIFY 播放連結</label>
                            <input name="spotifyLink" value={formData.spotifyLink || ''} onChange={handleChange} className="w-full bg-black border border-white/10 p-5 text-white text-base outline-none focus:border-brand-gold font-mono" placeholder="https://open.spotify.com/track/..." />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">致謝名單 (CREDITS)</label>
                            <textarea name="credits" value={formData.credits || ''} onChange={handleChange} rows={6} className="w-full bg-black border border-white/10 p-6 text-white text-xs leading-loose outline-none focus:border-brand-gold custom-scrollbar uppercase tracking-[0.2em]" />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest">作品歌詞 (LYRICS)</label>
                            <textarea name="lyrics" value={formData.lyrics || ''} onChange={handleChange} rows={12} className="w-full bg-black border border-white/10 p-8 text-white text-lg leading-relaxed outline-none focus:border-brand-gold custom-scrollbar font-light" placeholder="在這裡貼上歌詞文本..." />
                        </div>
                    </div>

                    <div className="pt-10">
                        <button type="submit" disabled={isSubmitting} className="w-full py-10 bg-brand-gold text-black font-black uppercase text-sm tracking-[0.6em] hover:bg-white transition-all shadow-[0_20px_60px_rgba(251,191,36,0.3)] pl-[0.6em]">
                            {isSubmitting ? '正在寫入權威資料庫...' : '完 成 儲 存 並 同 步'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
}; export default AddSong;
