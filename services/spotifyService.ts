
import { Song, ReleaseCategory } from "../types";

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

/**
 * 根據國際音樂工業標準判斷類別
 */
export const inferReleaseCategory = (totalTracks: number): ReleaseCategory => {
  if (totalTracks <= 3) return ReleaseCategory.Single;
  if (totalTracks >= 4 && totalTracks <= 6) return ReleaseCategory.EP;
  return ReleaseCategory.Album;
};

export const getArtistAlbums = async (artistId: string): Promise<SpotifyAlbum[]> => {
  let allAlbums: SpotifyAlbum[] = [];
  let nextUrl: string | null = `/api/spotify/artists/${artistId}/albums?limit=50&include_groups=album,single`;

  try {
    while (nextUrl) {
      const response = await fetch(nextUrl);
      if (!response.ok) break;
      const data = await response.json();
      allAlbums = [...allAlbums, ...(data.items || [])];
      
      if (data.next) {
          // Convert Spotify URL to proxy URL
          const url = new URL(data.next);
          nextUrl = `/api/spotify${url.pathname.replace('/v1', '')}${url.search}`;
      } else {
          nextUrl = null;
      }
    }
    const uniqueAlbums = Array.from(new Map(allAlbums.map(a => [a.id, a])).values());
    return uniqueAlbums.sort((a,b) => b.release_date.localeCompare(a.release_date));
  } catch (error) {
    console.error("Spotify Proxy API error during getArtistAlbums:", error);
    return [];
  }
};

// 批量獲取專輯詳細資訊 (包含 UPC, Label)
export const getSpotifyAlbumsBatch = async (albumIds: string[]): Promise<SpotifyAlbum[]> => {
    if (albumIds.length === 0) return [];
    try {
        const response = await fetch(`/api/spotify/albums?ids=${albumIds.join(',')}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.albums || [];
    } catch (error) {
        return [];
    }
};

// 批量獲取音軌詳細資訊 (包含 ISRC)
export const getSpotifyTracksBatch = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
    if (trackIds.length === 0) return [];
    try {
        const response = await fetch(`/api/spotify/tracks?ids=${trackIds.join(',')}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.tracks || [];
    } catch (error) {
        return [];
    }
};

export const getSpotifyAlbumTracks = async (albumId: string): Promise<SpotifyTrack[]> => {
    try {
        const response = await fetch(`/api/spotify/albums/${albumId}/tracks?limit=50`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        return [];
    }
};

export const getSpotifyAlbum = async (albumId: string): Promise<SpotifyAlbum | null> => {
    try {
        const response = await fetch(`/api/spotify/albums/${albumId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
};

export const getSpotifyFullTracks = async (trackIds: string[]): Promise<SpotifyTrack[]> => {
    if (trackIds.length === 0) return [];
    try {
        const response = await fetch(`/api/spotify/tracks?ids=${trackIds.join(',')}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.tracks || [];
    } catch (error) {
        return [];
    }
};

export const searchSpotifyTracks = async (query: string) => {
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=50`);
        const data = await response.json();
        return data.tracks?.items || [];
    } catch (e) { return []; }
};

export const searchSpotifyAlbums = async (query: string) => {
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=album&limit=20`);
        const data = await response.json();
        return data.albums?.items || [];
    } catch (e) { return []; }
};
