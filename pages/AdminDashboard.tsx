
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

type Tab = 'console' | 'catalog' | 'deployment' | 'guestbook';

const AdminDashboard: React.FC = () => {
  const { songs, deleteSong, globalSettings, uploadSettingsToCloud, bulkAddSongs, refreshData, syncSongWithSpotify, messages, approveMessage, deleteMessage } = useData();
  const { isAdmin, enableAdmin, logoutAdmin } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [passwordInput, setPasswordInput] = useState('');
  const [editingSettings, setEditingSettings] = useState(globalSettings);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const handleSaveSettings = async () => {
      await uploadSettingsToCloud(editingSettings);
      showToast("所有系統參數已鎖定並全球同步", "success");
  };

  const handleSyncAllSpotifyData = async () => {
    if (songs.length === 0) return;
    setIsBulkSyncing(true);
    showToast("啟動全域 Spotify 中繼資料同步協議...", "info");
    
    let successCount = 0;
    // 使用序列執行以避免過度請求
    for (const song of songs) {
        try {
            const success = await syncSongWithSpotify(song.id);
            if (success) successCount++;
        } catch (e) {
            console.error(`Sync failed for ${song.title}`);
        }
    }
    
    setIsBulkSyncing(false);
    showToast(`同步完成。共更新 ${successCount} 首曲目的權威資料。`, "success");
  };

  const updateField = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (key: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateField(key, reader.result as string);
                showToast("圖片上傳成功，請記得存檔", "success");
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
  };

  const handleExportAuthorityJSON = () => {
    try {
      const dataStr = JSON.stringify(songs, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const fileName = `WILLWI_MASTER_CATALOG_EXPORT.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
      showToast("權威檔案已產出。請務必將此檔案上傳至您的雲端，並更新 Master URL 以達成全球同步。", "success");
    } catch (e) { showToast("匯出失敗", "error"); }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
            await bulkAddSongs(importedData);
            showToast("本地資料庫已恢復為權威版本", "success");
        }
      } catch (err) { showToast("無效的 JSON 格式", "error"); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isAdmin) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-black p-10">
               <div className="bg-[#020617] border border-white/5 p-16 max-w-lg w-full rounded-sm text-center shadow-2xl animate-fade-in-up">
                   <h2 className="text-[10px] font-medium text-slate-700 tracking-[0.8em] uppercase mb-12">Authorized Access Only</h2>
                   
                   <div className="mb-12 space-y-4 text-left">
                       <p className="text-brand-gold font-medium text-[11px] tracking-widest">【管理登入需密碼】</p>
                       <p className="text-slate-400 font-light text-xs leading-loose tracking-[0.15em]">
                           掌握並確保所有資料正確，權限全開。<br/>
                           這是官方的Line@ <a href="https://lin.ee/y96nuSM" target="_blank" rel="noreferrer" className="text-brand-gold hover:underline">https://lin.ee/y96nuSM</a>
                       </p>
                   </div>

                   <input 
                     type="password" 
                     placeholder="ACCESS CODE" 
                     className="w-full bg-black border-b border-white/10 p-6 text-white text-center text-4xl outline-none focus:border-brand-gold font-mono tracking-[0.5em] mb-12" 
                     value={passwordInput} 
                     onChange={(e) => setPasswordInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && (passwordInput === (globalSettings.accessCode || '8520') ? enableAdmin() : showToast('驗證失敗', 'error'))}
                   />
                   <button 
                     onClick={() => passwordInput === (globalSettings.accessCode || '8520') ? enableAdmin() : showToast('驗證失敗', 'error')} 
                     className="w-full py-6 bg-white/5 text-white/40 font-medium uppercase text-[10px] tracking-[0.6em] hover:bg-white hover:text-black transition-all"
                   >
                       Verify Identity
                   </button>
               </div>
          </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-10 md:px-24 pt-32 pb-60 animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12 border-b border-white/5 pb-10">
          <div className="w-full md:w-auto">
              <h1 className="text-6xl font-thin text-white uppercase tracking-tighter opacity-90 leading-none">Console</h1>
              <div className="flex gap-12 mt-12">
                  <button onClick={() => setActiveTab('catalog')} className={`text-[10px] font-medium uppercase tracking-[0.4em] pb-3 transition-all ${activeTab === 'catalog' ? 'text-brand-gold border-b border-brand-gold' : 'text-slate-600 hover:text-white'}`}>Master Archive</button>
                  <button onClick={() => setActiveTab('console')} className={`text-[10px] font-medium uppercase tracking-[0.4em] pb-3 transition-all ${activeTab === 'console' ? 'text-brand-gold border-b border-brand-gold' : 'text-slate-600 hover:text-white'}`}>Parameters</button>
                  <button onClick={() => setActiveTab('deployment')} className={`text-[10px] font-medium uppercase tracking-[0.4em] pb-3 transition-all ${activeTab === 'deployment' ? 'text-brand-gold border-b border-brand-gold' : 'text-slate-600 hover:text-white'}`}>Deployment</button>
                  <button onClick={() => setActiveTab('guestbook')} className={`text-[10px] font-medium uppercase tracking-[0.4em] pb-3 transition-all ${activeTab === 'guestbook' ? 'text-brand-gold border-b border-brand-gold' : 'text-slate-600 hover:text-white'}`}>Guestbook</button>
              </div>
          </div>
          <div className="flex items-center gap-6">
              <button onClick={() => { refreshData(); showToast("正在重新同步雲端權威資料..."); }} className="text-[9px] text-brand-gold/40 hover:text-brand-gold uppercase tracking-widest transition-all">Manual Sync</button>
              <button onClick={logoutAdmin} className="px-10 py-3 bg-white/5 border border-white/10 text-slate-700 text-[9px] font-medium uppercase tracking-[0.5em] hover:text-white transition-all">Exit Console</button>
          </div>
      </div>

      {activeTab === 'catalog' && (
          <div className="space-y-16">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-white/[0.02] border border-white/5 p-10 space-y-4">
                        <h4 className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Archive Integrity</h4>
                        <p className="text-3xl font-thin text-white">{songs.length} <span className="text-[10px] text-slate-700 font-mono">Tracks</span></p>
                        <p className="text-[9px] text-emerald-500/40 uppercase tracking-widest">Locked for Production</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-10 space-y-4">
                        <h4 className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Authority Status</h4>
                        <p className="text-sm font-mono text-brand-gold/60">{globalSettings.masterDataUrl ? 'ONLINE (Master Bound)' : 'LOCAL ONLY'}</p>
                        <p className="text-[9px] text-slate-800 uppercase tracking-widest">Connection Protocol v10</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-10 flex flex-col justify-center items-center gap-4">
                         <button 
                            disabled={isBulkSyncing}
                            onClick={handleSyncAllSpotifyData} 
                            className={`w-full py-5 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all ${isBulkSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                            {isBulkSyncing ? 'Syncing System...' : 'Global Spotify Sync'}
                         </button>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-10 flex flex-col justify-center items-center">
                         <button onClick={() => navigate('/add')} className="w-full py-5 bg-brand-gold/80 text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Create New Master Entry</button>
                    </div>
               </div>
               
               <div className="overflow-x-auto border border-white/5">
                   <table className="w-full text-left">
                       <thead className="text-[9px] text-slate-800 uppercase tracking-[0.6em] border-b border-white/5 bg-white/[0.02]">
                           <tr>
                               <th className="p-8 font-medium">Identity</th>
                               <th className="p-8 font-medium">Regulatory IDs</th>
                               <th className="p-8 font-medium text-right">Operation</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/[0.02]">
                           {songs.map(s => (
                               <tr key={s.id} className="hover:bg-white/[0.01] transition-all group">
                                   <td className="p-8 flex items-center gap-8">
                                       <img src={s.coverUrl || undefined} className="w-16 h-16 object-cover border border-white/5 transition-all duration-1000" />
                                       <div className="space-y-1">
                                           <p className="font-thin text-white text-lg tracking-[0.2em] uppercase">{s.title}</p>
                                           <p className="text-[9px] text-slate-800 font-mono uppercase tracking-widest">{s.releaseDate} • {s.releaseCompany}</p>
                                       </div>
                                   </td>
                                   <td className="p-8 space-y-2">
                                       <p className="font-mono text-[9px] text-slate-800 flex items-center gap-3">
                                           <span className={`w-2 h-2 rounded-full ${s.isrc ? 'bg-emerald-500' : 'bg-rose-500/20'}`}></span>
                                           ISRC: {s.isrc || 'NOT DEFINED'}
                                       </p>
                                       <p className="font-mono text-[9px] text-slate-800 flex items-center gap-3">
                                           <span className={`w-2 h-2 rounded-full ${s.upc ? 'bg-brand-gold' : 'bg-rose-500/20'}`}></span>
                                           UPC: {s.upc || 'NOT DEFINED'}
                                       </p>
                                   </td>
                                   <td className="p-8 text-right space-x-8">
                                       <button onClick={() => navigate(`/add?edit=${s.id}`)} className="text-[9px] font-medium text-white/30 hover:text-white uppercase tracking-widest transition-colors">Modify</button>
                                       <button onClick={() => window.confirm('確定從本地存檔中移除？') && deleteSong(s.id)} className="text-[9px] font-medium text-rose-900/40 hover:text-rose-600 uppercase tracking-widest transition-colors">Purge</button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
          </div>
      )}

      {activeTab === 'console' && (
        <div className="w-full space-y-20">
            {/* 核心雲端參數 */}
            <div className="bg-white/[0.01] border border-white/5 p-16 space-y-12 shadow-2xl relative">
                <div className="absolute top-8 left-8">
                    <span className="text-[8px] text-brand-gold font-black uppercase tracking-[0.4em]">Section 01 // Cloud Hub</span>
                </div>
                <div className="space-y-8 pt-10">
                    <label className="text-[10px] text-brand-gold font-black uppercase tracking-[0.8em] block">Authority Master URL (Global Persistence)</label>
                    <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-widest" value={editingSettings.masterDataUrl || ''} onChange={e => updateField('masterDataUrl', e.target.value)} placeholder="https://dl.dropboxusercontent.com/s/..." />
                </div>
            </div>

            {/* 影視媒體參數 */}
            <div className="bg-white/[0.01] border border-white/5 p-16 space-y-12 shadow-2xl relative">
                <div className="absolute top-8 left-8">
                    <span className="text-[8px] text-brand-gold font-black uppercase tracking-[0.4em]">Section 02 // Cinema Media</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                    <div className="space-y-8">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] block">Background Protocol URL (Video)</label>
                        <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-widest" value={editingSettings.backgroundVideoUrl || ''} onChange={e => updateField('backgroundVideoUrl', e.target.value)} placeholder="影片連結 (.mp4)" />
                    </div>
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] block">Background Image URL</label>
                            <button onClick={() => handleImageUpload('backgroundImageUrl')} className="text-[8px] text-brand-gold font-black border border-brand-gold/20 px-3 py-1 hover:bg-brand-gold hover:text-black transition-all">UPLOAD BG IMAGE</button>
                        </div>
                        <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-widest" value={editingSettings.backgroundImageUrl || ''} onChange={e => updateField('backgroundImageUrl', e.target.value)} />
                    </div>
                    <div className="space-y-8">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] block">Ambient Protocol URL (BGM)</label>
                        <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-widest" value={editingSettings.bgmUrl || ''} onChange={e => updateField('bgmUrl', e.target.value)} placeholder="背景音樂連結 (.mp3)" />
                    </div>
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] block">Portrait Protocol URL</label>
                            <button onClick={() => handleImageUpload('portraitUrl')} className="text-[8px] text-brand-gold font-black border border-brand-gold/20 px-3 py-1 hover:bg-brand-gold hover:text-black transition-all">UPLOAD PHOTO</button>
                        </div>
                        <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-widest" value={editingSettings.portraitUrl || ''} onChange={e => updateField('portraitUrl', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* 金流結界參數 (QR Codes) */}
            <div className="bg-white/[0.01] border border-white/5 p-16 space-y-12 shadow-2xl relative">
                <div className="absolute top-8 left-8">
                    <span className="text-[8px] text-brand-gold font-black uppercase tracking-[0.4em]">Section 03 // Payment Protocol</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
                    {[
                        { key: 'qr_production', label: 'QR: Production (對位)' },
                        { key: 'qr_cinema', label: 'QR: Cinema (代製)' },
                        { key: 'qr_support', label: 'QR: Support (支持)' },
                        { key: 'qr_line', label: 'QR: Line (官方)' },
                        { key: 'qr_global_payment', label: 'Global Payment (通配)' }
                    ].map(field => (
                        <div key={field.key} className="space-y-6">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">{field.label}</label>
                                <button onClick={() => handleImageUpload(field.key)} className="text-[7px] text-brand-gold/40 hover:text-brand-gold uppercase font-black transition-all">Upload QR</button>
                            </div>
                            <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono truncate" value={(editingSettings as any)[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} />
                        </div>
                    ))}
                    
                    <div className="space-y-6">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] block">Access Protocol Code</label>
                        <input className="w-full bg-black border border-white/10 p-5 text-white text-sm outline-none focus:border-brand-gold font-mono tracking-[0.5em]" value={editingSettings.accessCode || ''} onChange={e => updateField('accessCode', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* 官方社交鏈結 */}
            <div className="bg-white/[0.01] border border-white/5 p-16 space-y-12 shadow-2xl relative">
                <div className="absolute top-8 left-8">
                    <span className="text-[8px] text-brand-gold font-black uppercase tracking-[0.4em]">Section 04 // Social Gateway</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Link: Official Website</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.link_website || ''} onChange={e => updateField('link_website', e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Link: Spotify</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.link_spotify || ''} onChange={e => updateField('link_spotify', e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Link: Apple Music</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.link_apple || ''} onChange={e => updateField('link_apple', e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Link: YouTube Channel</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.link_youtube || ''} onChange={e => updateField('link_youtube', e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Link: Tidal</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.link_tidal || ''} onChange={e => updateField('link_tidal', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Countdown & Video Section */}
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-4 bg-brand-gold"></div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">Countdown & Video (About Page)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">Countdown Target Date (e.g., 2026-12-31T23:59:59)</label>
                        <input type="datetime-local" className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" value={editingSettings.countdownTargetDate || ''} onChange={e => updateField('countdownTargetDate', e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <label className="text-[9px] text-white/30 font-medium uppercase tracking-[0.4em] block">YouTube Video URL (New Release)</label>
                        <input className="w-full bg-transparent border-b border-white/5 py-3 text-white text-xs outline-none focus:border-brand-gold font-mono" placeholder="https://www.youtube.com/watch?v=..." value={editingSettings.youtubeVideoUrl || ''} onChange={e => updateField('youtubeVideoUrl', e.target.value)} />
                    </div>
                </div>
            </div>

            <button onClick={handleSaveSettings} className="w-full py-10 bg-brand-gold text-black text-[11px] font-black uppercase tracking-[1em] hover:bg-white transition-all shadow-[0_30px_100px_rgba(0,0,0,0.2)] pl-[1em]">Update All Global Parameters</button>
        </div>
      )}

      {activeTab === 'deployment' && (
          <div className="max-w-5xl py-12 space-y-16">
              <div className="bg-white/[0.01] border border-emerald-900/10 p-16 space-y-16 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                      <span className="text-[8px] border border-emerald-900/40 text-emerald-900/60 px-3 py-1 font-black uppercase tracking-widest">Authority Control</span>
                  </div>
                  <div className="space-y-8">
                      <h3 className="text-4xl font-thin text-white uppercase tracking-tighter leading-none">Authority Export Protocol</h3>
                      <div className="space-y-4">
                          <p className="text-xs text-slate-600 font-thin tracking-widest leading-loose max-w-2xl">
                              1. 您在目前瀏覽器中 Key 完的所有資料，目前僅存在這台電腦。
                          </p>
                          <p className="text-xs text-white/60 font-medium tracking-widest leading-loose max-w-2xl">
                              2. 點擊下方按鈕產出 JSON 檔案。
                          </p>
                          <p className="text-xs text-slate-600 font-thin tracking-widest leading-loose max-w-2xl">
                              3. 將該檔案上傳至您的雲端，並回「Parameters」分頁更新 Master URL。
                          </p>
                      </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8">
                      <button onClick={handleExportAuthorityJSON} className="flex-1 py-10 bg-emerald-600 text-white font-black uppercase text-[11px] tracking-[0.6em] hover:bg-white hover:text-black transition-all pl-[0.6em] shadow-2xl">產出最新權威 JSON 檔案 (Export)</button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-10 border border-white/10 text-white/40 font-medium uppercase text-[11px] tracking-[0.6em] hover:text-white transition-all pl-[0.6em]">匯入 JSON 覆蓋本地暫存 (Import)</button>
                      <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'guestbook' && (
          <div className="space-y-16">
               <div className="overflow-x-auto border border-white/5">
                   <table className="w-full text-left">
                       <thead className="text-[9px] text-slate-800 uppercase tracking-[0.6em] border-b border-white/5 bg-white/[0.02]">
                           <tr>
                               <th className="p-8 font-medium">Message</th>
                               <th className="p-8 font-medium">Author / Date</th>
                               <th className="p-8 font-medium">Status</th>
                               <th className="p-8 font-medium text-right">Operation</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/[0.02]">
                           {messages.map(m => (
                               <tr key={m.id} className="hover:bg-white/[0.01] transition-all group">
                                   <td className="p-8">
                                       <p className="font-light text-white text-sm whitespace-pre-wrap max-w-md">{m.message}</p>
                                   </td>
                                   <td className="p-8 space-y-1">
                                       <p className="font-medium text-white text-xs">{m.nickname}</p>
                                       <p className="text-[9px] text-slate-500 uppercase tracking-widest">{new Date(m.createdAt).toLocaleString()}</p>
                                   </td>
                                   <td className="p-8">
                                       {m.isSpam ? (
                                           <span className="text-[9px] text-rose-500 border border-rose-500/20 px-2 py-1 uppercase tracking-widest">Spam</span>
                                       ) : m.isApproved ? (
                                           <span className="text-[9px] text-emerald-500 border border-emerald-500/20 px-2 py-1 uppercase tracking-widest">Approved</span>
                                       ) : (
                                           <span className="text-[9px] text-brand-gold border border-brand-gold/20 px-2 py-1 uppercase tracking-widest">Pending</span>
                                       )}
                                   </td>
                                   <td className="p-8 text-right space-x-4">
                                       {!m.isApproved && !m.isSpam && (
                                           <button onClick={() => approveMessage(m.id)} className="text-[9px] font-medium text-emerald-500/60 hover:text-emerald-500 uppercase tracking-widest transition-colors">Approve</button>
                                       )}
                                       <button onClick={() => window.confirm('確定刪除此留言？') && deleteMessage(m.id)} className="text-[9px] font-medium text-rose-900/40 hover:text-rose-600 uppercase tracking-widest transition-colors">Delete</button>
                                   </td>
                               </tr>
                           ))}
                           {messages.length === 0 && (
                               <tr>
                                   <td colSpan={4} className="p-8 text-center text-slate-600 text-xs font-light">No messages found.</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
          </div>
      )}

    </div>
  );
}; export default AdminDashboard;
