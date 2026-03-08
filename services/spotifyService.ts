
import { Song, ReleaseCategory } from "../types";

const CLIENT_ID = 'a64ec262abd745eeaf4db5faf597d19b';
const CLIENT_SECRET = '67657590909b48afbf1fd45e09400b6b';

let accessToken = '';
let tokenExpiration = 0;

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    release_date: string;
    images: { url: string }[];
    external_ids?: { upc?: string; ean?: string };
    label?: string;
    album_type?: 'album' | 'single' | 'compilation';
  };
  external_ids: { isrc?: string };
  external_urls: { spotify: string };
  uri: string;
  track_number?: number;
  duration_ms?: number;
  preview_url?: string | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  release_date: string;
  total_tracks: number;
  images: { url: string }[];
  external_urls: { spotify: string };
  label?: string;
  external_ids?: { upc?: string; ean?: string };
  album_type?: 'album' | 'single' | 'compilation';
  tracks?: {
    items: SpotifyTrack[];
  };
}

export const getSpotifyToken = async () => {
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) return null;

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiration = Date.now() + ((data.expires_in - 60) * 1000);
    return accessToken;
  } catch (error) {
    console.warn("Spotify API blocked by CORS or Network error.");
    return null;
  }
};

/**
 * 根據國際音樂工業標準判斷類別
 */
export const inferReleaseCategory = (totalTracks: number): ReleaseCategory => {
  if (totalTracks <= 3) return ReleaseCategory.Single;
  if (totalTracks >= 4 && totalTracks <= 6) return ReleaseCategory.EP;
  return ReleaseCategory.Album;
};

export const getArtistAlbums = async (artistId: string): Promise<SpotifyAlbum[]> => {
  const token = await getSpotifyToken();
  if (!token) return []; 

  let allAlbums: SpotifyAlbum[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album,single`;

  try {
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) break;
      const data = await response.json();
      allAlbums = [...allAlbums, ...(data.items || [])];
      nextUrl = data.next;
    }
    const uniqueAlbums = Array.from(new Map(allAlbums.map(a => [a.id, a])).values());
    return uniqueAlbums.sort((a,b) => b.release_date.localeCompare(a.release_date));
  } catch (error) {
    console.error("Spotify API error during getArtistAlbums:", error);
    return [];
  }
};

// 批量獲取專輯詳細資訊 (包含 UPC, Label)
export const getSpotifyAlbumsBatch = async (albumIds: string[]): Promise<SpotifyAlbum[]> => {
    const token = await getSpotifyToken();
    if (!token || albumIds.length === 0) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/albums?ids=${albumIds.join(',')}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.albums || [];
    } catch (error) {
        return [];
    }
};

// 批量獲取音軌詳細資訊 (包含 ISRC)
export const getSpotifyTracksBatch = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
    const token = await getSpotifyToken();
    if (!token || trackIds.length === 0) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.tracks || [];
    } catch (error) {
        return [];
    }
};

export const getSpotifyAlbumTracks = async (albumId: string): Promise<SpotifyTrack[]> => {
    const token = await getSpotifyToken();
    if (!token) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        return [];
    }
};

export const getSpotifyAlbum = async (albumId: string): Promise<SpotifyAlbum | null> => {
    const token = await getSpotifyToken();
    if (!token) return null;
    try {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
};

export const getSpotifyFullTracks = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
    const token = await getSpotifyToken();
    if (!token || trackIds.length === 0) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.tracks || [];
    } catch (error) {
        return [];
    }
};

export const searchSpotifyTracks = async (query: string) => {
    const token = await getSpotifyToken();
    if (!token) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.tracks?.items || [];
    } catch (e) { return []; }
};

export const searchSpotifyAlbums = async (query: string) => {
    const token = await getSpotifyToken();
    if (!token) return [];
    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=20`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.albums?.items || [];
    } catch (e) { return []; }
};
