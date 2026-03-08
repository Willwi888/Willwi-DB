
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Song, SongContextType, Language, ProjectType, ReleaseCategory } from '../types';
import { dbService, GuestbookMessage } from '../services/db';
import { OFFICIAL_CATALOG, ASSETS } from './InitialData';
import { useToast } from './ToastContext';
import { searchSpotifyTracks, getSpotifyAlbum } from '../services/spotifyService';

export { ASSETS };

const WILLWI_OFFICIAL_SPOTIFY_ID = '3ascZ8Rb2KDw4QyCy29Om4';

export interface GlobalSettings {
    portraitUrl: string;
    defaultCoverUrl: string;
    qr_global_payment: string;
    qr_line: string;
    qr_production: string;
    qr_cinema: string;
    qr_support: string;
    accessCode: string;
    exclusiveYoutubeUrl?: string;
    youtubePlaylistUrl?: string; 
    bgmUrl?: string;
    backgroundVideoUrl?: string; 
    backgroundImageUrl?: string; // 新增：背景圖檔支援
    masterDataUrl?: string; 
    link_website?: string;
    link_spotify?: string;
    link_apple?: string;
    link_youtube?: string;
    link_tidal?: string;
    countdownTargetDate?: string;
    youtubeVideoUrl?: string;
}

interface ExtendedSongContextType extends SongContextType {
    isSyncing: boolean;
    syncSuccess: boolean;
    lastError: string | null;
    refreshData: () => Promise<void>;
    uploadSongsToCloud: (dataToSync: Song[]) => Promise<boolean>;
    uploadSettingsToCloud: (settings: GlobalSettings) => Promise<void>;
    bulkAppendSongs: (songs: Song[]) => Promise<boolean>;
    bulkDeleteSongs: (ids: string[]) => Promise<void>;
    globalSettings: GlobalSettings;
    setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
    currentSong: Song | null;
    setCurrentSong: (song: Song | null) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    playSong: (song: Song) => void;
    syncSongWithSpotify: (id: string) => Promise<boolean>;
    
    // Guestbook
    messages: GuestbookMessage[];
    addMessage: (msg: Omit<GuestbookMessage, 'id' | 'createdAt' | 'isApproved' | 'isSpam'>) => Promise<boolean>;
    approveMessage: (id: string) => Promise<void>;
    deleteMessage: (id: string) => Promise<void>;
}

const DataContext = createContext<ExtendedSongContextType | undefined>(undefined);

const SETTINGS_LOCAL_KEY = 'willwi_settings_v11_strict';

export const normalizeIdentifier = (val: string) => {
    const cleaned = (val || '').trim().replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleaned || `TID_${Date.now()}`;
};

export const resolveDirectLink = (url: string) => {
    if (!url || typeof url !== 'string') return '';
    let cleanUrl = url.trim();
    if (cleanUrl.includes('dropbox.com')) {
        return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace(/\?dl=[01]/, '?raw=1');
    }
    return cleanUrl;
};

// Auto-reconnect fetch wrapper
const fetchWithRetry = async (url: string, retries = 3, delay = 2000): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return res;
            throw new Error(`HTTP error! status: ${res.status}`);
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Fetch failed after retries');
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
      const backup = localStorage.getItem(SETTINGS_LOCAL_KEY);
      if (backup) return JSON.parse(backup);
      return { 
          portraitUrl: ASSETS.willwiPortrait, 
          defaultCoverUrl: ASSETS.defaultCover,
          qr_global_payment: '', qr_line: '', qr_production: '', qr_cinema: '', qr_support: '', 
          accessCode: '8520', exclusiveYoutubeUrl: '', bgmUrl: '', backgroundVideoUrl: '', 
          backgroundImageUrl: '', // 初始背景圖
          masterDataUrl: '',
          youtubePlaylistUrl: 'https://music.youtube.com/playlist?list=OLAK5uy_maxVGZNwT7xRs2NC_s6ChLDJRKA4_raA4',
          link_website: 'https://willwi.com',
          link_spotify: `https://open.spotify.com/artist/${WILLWI_OFFICIAL_SPOTIFY_ID}`,
          link_apple: 'https://music.apple.com/us/artist/willwi/1798471457',
          link_youtube: 'https://www.youtube.com/@willwi',
          link_tidal: 'https://tidal.com/artist/54856609',
          countdownTargetDate: '',
          youtubeVideoUrl: ''
      };
  });

  const loadData = useCallback(async () => {
      setIsSyncing(true);
      setLastError(null);
      
      try {
          let localSongs = await dbService.getAllSongs();
          const combinedMap = new Map<string, Song>();
          
          if (globalSettings.masterDataUrl) {
              try {
                  const res = await fetchWithRetry(resolveDirectLink(globalSettings.masterDataUrl));
                  const masterSongs = await res.json();
                  if (Array.isArray(masterSongs)) {
                      masterSongs.forEach(s => combinedMap.set(s.id, { ...s, origin: 'cloud' }));
                      await dbService.bulkAdd(masterSongs);
                      setSyncSuccess(true);
                  }
              } catch (e) { 
                  console.warn("Authority Master unreachable, falling back to local storage.");
                  setSyncSuccess(false);
                  setLastError("無法連線至主資料庫，目前使用本地快取。系統將自動重試。");
              }
          }

          localSongs.forEach(s => {
              if (!combinedMap.has(s.id)) {
                  combinedMap.set(s.id, s);
              }
          });

          const combined = Array.from(combinedMap.values()).sort((a,b) => {
              return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
          });
          
          setSongs(combined);
          
          // Load messages
          const msgs = await dbService.getAllMessages();
          setMessages(msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          
      } catch (error) {
          console.error("Data load error:", error);
          setSyncSuccess(false);
          setLastError("資料載入發生錯誤");
      } finally {
          setIsSyncing(false);
      }
  }, [globalSettings.masterDataUrl]);

  // Auto-reconnect mechanism
  useEffect(() => {
      loadData();
      
      // Setup periodic sync if masterDataUrl is present
      if (globalSettings.masterDataUrl) {
          syncIntervalRef.current = setInterval(() => {
              loadData();
          }, 60000); // Try to sync every minute
      }
      
      return () => {
          if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      };
  }, [loadData, globalSettings.masterDataUrl]);

  const syncSongWithSpotify = async (id: string) => {
    const song = songs.find(s => s.id === id);
    if (!song) return false;
    
    try {
        const results = await searchSpotifyTracks(`artist:Willwi ${song.title}`);
        const match = results.find((t: any) => t.artists.some((a: any) => a.id === WILLWI_OFFICIAL_SPOTIFY_ID));
        
        if (match) {
            const fullAlbum = await getSpotifyAlbum(match.album.id);
            const updates = {
                isrc: match.external_ids?.isrc || song.isrc,
                upc: fullAlbum?.external_ids?.upc || song.upc,
                spotifyLink: match.external_urls?.spotify || song.spotifyLink,
                releaseCompany: fullAlbum?.label || song.releaseCompany,
                coverUrl: match.album?.images?.[0]?.url || song.coverUrl
            };
            const u = { ...song, ...updates, origin: 'local' as const };
            await dbService.updateSong(u);
            setSongs(prev => prev.map(x => x.id === id ? u : x));
            return true;
        }
        return false;
    } catch (e) { return false; }
  };

  const uploadSettingsToCloud = async (settings: GlobalSettings) => {
    setGlobalSettings(settings);
    localStorage.setItem(SETTINGS_LOCAL_KEY, JSON.stringify(settings));
    showToast("系統母帶設定已鎖定 (Locked)", "success");
  };

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <DataContext.Provider value={{ 
        songs, 
        addSong: async (s) => {
            const songId = s.isrc ? normalizeIdentifier(s.isrc) : normalizeIdentifier(s.title + Date.now());
            const song = { ...s, id: songId, origin: 'local' as const };
            await dbService.addSong(song);
            setSongs(prev => [song, ...prev]);
            return true;
        },
        updateSong: async (id, s) => {
            const existing = songs.find(x => x.id === id);
            if (existing) {
                const u = { ...existing, ...s };
                await dbService.updateSong(u);
                setSongs(prev => prev.map(x => x.id === id ? u : x));
                return true;
            }
            return false;
        },
        deleteSong: async (id) => {
            await dbService.deleteSong(id);
            setSongs(prev => prev.filter(x => x.id !== id));
        },
        bulkUpdateSongs: async (ids, updates) => {
            const list = songs.filter(s => ids.includes(s.id)).map(s => ({ ...s, ...updates }));
            for (const item of list) await dbService.updateSong(item);
            setSongs(prev => prev.map(s => ids.includes(s.id) ? { ...s, ...updates } : s));
            return true;
        },
        getSong: (id) => songs.find(s => s.id === id),
        bulkAddSongs: async (s) => {
            await dbService.clearAllSongs();
            await dbService.bulkAdd(s);
            setSongs(s);
            return true;
        },
        bulkAppendSongs: async (items) => {
            await dbService.bulkAdd(items);
            setSongs(prev => [...prev, ...items]);
            return true;
        },
        isSyncing, syncSuccess, lastError, refreshData: loadData, 
        uploadSongsToCloud: async () => true,
        uploadSettingsToCloud, globalSettings, setGlobalSettings,
        currentSong, setCurrentSong, isPlaying, setIsPlaying, playSong: (s) => { setCurrentSong(s); setIsPlaying(true); },
        syncSongWithSpotify,
        
        messages,
        addMessage: async (msgData) => {
            const { checkSpam } = await import('../services/geminiService');
            const isSpam = await checkSpam(msgData.message);
            
            const newMsg: GuestbookMessage = {
                ...msgData,
                id: `msg_${Date.now()}`,
                createdAt: new Date().toISOString(),
                isApproved: false, // Requires admin approval
                isSpam
            };
            
            await dbService.addMessage(newMsg);
            setMessages(prev => [newMsg, ...prev]);
            
            // Send notification to admin (simulated)
            if (!isSpam) {
                console.log(`[Admin Notification] New guestbook message from ${newMsg.nickname}: ${newMsg.message}`);
            }
            
            return !isSpam;
        },
        approveMessage: async (id) => {
            const msg = messages.find(m => m.id === id);
            if (msg) {
                const updated = { ...msg, isApproved: true };
                await dbService.updateMessage(updated);
                setMessages(prev => prev.map(m => m.id === id ? updated : m));
            }
        },
        deleteMessage: async (id) => {
            await dbService.deleteMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData error');
  return context;
};
