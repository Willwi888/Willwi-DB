
import { Song, Language, ProjectType, ReleaseCategory } from '../types';

export const ASSETS = {
    willwiPortrait: "https://drive.google.com/thumbnail?id=18rpLhJQKHKK5EeonFqutlOoKAI2Eq_Hd&sz=w2000",
    defaultCover: "https://placehold.co/1000x1000/020617/fbbf24?text=Willwi+Music"
};

export const STANDARD_CREDITS = `© 2025 Willwi Music
℗ 2025 Willwi Music

Main Artist : Willwi
Composer : Tsung Yu Chen
Lyricist : Tsung Yu Chen
Arranger : Willwi
Producer : Will Chen
Recording Studio | Willwi Studio, Taipei
Label | Willwi Music`;

export const OFFICIAL_CATALOG: Song[] = [
  {
    id: 'QZES62669547',
    title: '未說出口的保重',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273a557b774619d85600f68d6c7',
    language: Language.Mandarin,
    projectType: ProjectType.Indie,
    releaseCategory: ReleaseCategory.Single,
    releaseDate: '2024-12-05',
    isEditorPick: true,
    isInteractiveActive: true,
    isrc: 'QZES62669547',
    upc: '821567890123',
    spotifyLink: 'https://open.spotify.com/track/4C6C8X6p9D2w1wY6p1wY6p',
    audioUrl: '', 
    lyrics: `這世界 有太多 意外
明明才 說過 要 再見
卻成了 最後 一 面`,
    credits: STANDARD_CREDITS
  }
];
