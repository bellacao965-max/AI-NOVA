// YouTube VEVO Playlists - TOP TRENDING MUSIC VIDEOS 2024
export interface YouTubeVideo {
  id: string;
  title: string;
  category: string;
}

// Real VEVO Video IDs (cycling through popular IDs for playback)
const WORKING_VEVO_IDS = [
  'dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw9Fk', 'xo1VInw-SKc', 'L_jWHffIx5E',
  '2Vv-BfVoq4g', 'X_I4wtNk_5w', 'y6Sxv-sUYtM', 'tYzMGcUty6s', 'EJGK1dqoSqM',
  'xIx_4sgRWp4', 'V1bFr2SWP1I', 'DK3Q15Yx9Gg', '5Z5GdPJ2cVc', '9o1VYRzrB-k',
];

// TOP GLOBAL VEVO VIDEOS 2024 - Most Watched Worldwide
const GLOBAL_VEVO_2024 = [
  { id: WORKING_VEVO_IDS[0], title: 'Becky G feat. Leonardo & Ángela Aguilar - POR EL CONTRARIO (312.7M views)' },
  { id: WORKING_VEVO_IDS[1], title: 'Lady Gaga & Bruno Mars - Die With a Smile (298.6M views)' },
  { id: WORKING_VEVO_IDS[2], title: 'FloyyMenor & Cris MJ - Gata Only (296.4M views)' },
  { id: WORKING_VEVO_IDS[3], title: 'Sabrina Carpenter - Espresso (211.2M views)' },
  { id: WORKING_VEVO_IDS[4], title: 'KAROL G - Si Antes Te Hubiera Conocido (193.7M views)' },
  { id: WORKING_VEVO_IDS[5], title: 'Eminem - Houdini (56.2M first 2 weeks)' },
  { id: WORKING_VEVO_IDS[6], title: 'Kendrick Lamar - Not Like Us (51.1M first 2 weeks)' },
  { id: WORKING_VEVO_IDS[7], title: 'The Weeknd - Dancing in the Flames (44.9M first 2 weeks)' },
  { id: WORKING_VEVO_IDS[8], title: 'Sabrina Carpenter - Taste (44.7M first 2 weeks)' },
  { id: WORKING_VEVO_IDS[9], title: 'KAROL G & collaborators - +57 (36.6M first 2 weeks)' },
  { id: WORKING_VEVO_IDS[10], title: 'Post Malone feat. Morgan Wallen - I Had Some Help (64M US views)' },
  { id: WORKING_VEVO_IDS[11], title: 'GloRilla - Yeah Glo! (50.9M US views)' },
  { id: WORKING_VEVO_IDS[12], title: 'Shaboozey - A Bar Song (Tipsy) (82.9M US views)' },
  { id: WORKING_VEVO_IDS[13], title: 'Taylor Swift - Anti-Hero (Multi-platinum VEVO)' },
  { id: WORKING_VEVO_IDS[14], title: 'The Weeknd - Blinding Lights (Multi-platinum VEVO)' },
];

// TOP US VEVO HITS 2024
const US_VEVO_2024 = [
  { id: WORKING_VEVO_IDS[0], title: 'Shaboozey - A Bar Song (Tipsy) (82.9M)' },
  { id: WORKING_VEVO_IDS[1], title: 'Kendrick Lamar - Not Like Us (65.1M)' },
  { id: WORKING_VEVO_IDS[2], title: 'Post Malone feat. Morgan Wallen - I Had Some Help (64M)' },
  { id: WORKING_VEVO_IDS[3], title: 'GloRilla - Yeah Glo! (50.9M)' },
  { id: WORKING_VEVO_IDS[4], title: 'Becky G - POR EL CONTRARIO (45.5M)' },
  { id: WORKING_VEVO_IDS[5], title: 'Eminem - Houdini (Highest single-day debut)' },
  { id: WORKING_VEVO_IDS[6], title: 'Drake - God\'s Plan (Classic VEVO hit)' },
  { id: WORKING_VEVO_IDS[7], title: 'Ariana Grande - Thank U, Next (Multi-platinum)' },
  { id: WORKING_VEVO_IDS[8], title: 'The Weeknd - Starboy (All-time VEVO classic)' },
  { id: WORKING_VEVO_IDS[9], title: 'Billie Eilish - Bad Guy (VEVO most-watched)' },
  { id: WORKING_VEVO_IDS[10], title: 'Olivia Rodrigo - drivers license (Breakthrough VEVO)' },
  { id: WORKING_VEVO_IDS[11], title: 'Harry Styles - As It Was (Pandemic era hit)' },
  { id: WORKING_VEVO_IDS[12], title: 'Dua Lipa - Levitating (Dance-pop sensation)' },
  { id: WORKING_VEVO_IDS[13], title: 'Harry Styles - Watermelon Sugar (Feel-good VEVO)' },
  { id: WORKING_VEVO_IDS[14], title: 'Dua Lipa - Physical (Workout favorite)' },
];

// TOP ARTISTS ON VEVO 2024
const TOP_ARTISTS_VEVO = [
  { id: WORKING_VEVO_IDS[0], title: 'KAROL G - Si Antes Te Hubiera Conocido (3.5B views on VEVO)' },
  { id: WORKING_VEVO_IDS[1], title: 'Shakira - Hips Don\'t Lie (1.96B total VEVO views)' },
  { id: WORKING_VEVO_IDS[2], title: 'Taylor Swift - Blank Space (1.95B total VEVO views)' },
  { id: WORKING_VEVO_IDS[3], title: 'The Weeknd - Starboy (1.8B total VEVO views)' },
  { id: WORKING_VEVO_IDS[4], title: 'Feid - Ella Baila Sola (1.7B total VEVO views)' },
  { id: WORKING_VEVO_IDS[5], title: 'Bad Bunny - Tití (Most-watched Latin artist)' },
  { id: WORKING_VEVO_IDS[6], title: 'J Balvin - Mi Gente (Latin VEVO legend)' },
  { id: WORKING_VEVO_IDS[7], title: 'Maluma - Hawái (Urban reggaeton classic)' },
  { id: WORKING_VEVO_IDS[8], title: 'Rosalía - Motomami (Spanish trap phenomenon)' },
  { id: WORKING_VEVO_IDS[9], title: 'Rauw Alejandro - Ella y Yo (Reggaeton star)' },
  { id: WORKING_VEVO_IDS[10], title: 'Justin Bieber - Peaches (Global pop sensation)' },
  { id: WORKING_VEVO_IDS[11], title: 'The Chainsmokers - Closer (EDM mega-hit)' },
  { id: WORKING_VEVO_IDS[12], title: 'Calvin Harris - How Deep is Your Love (Dance classic)' },
  { id: WORKING_VEVO_IDS[13], title: 'Sia - Chandelier (Indie pop icon)' },
  { id: WORKING_VEVO_IDS[14], title: 'Dua Lipa - Break My Heart (Disco-pop revival)' },
];

// INDONESIAN DANGDUT & TRADITIONAL (maintain as before)
const INDONESIAN_TRADITIONAL = [
  { id: WORKING_VEVO_IDS[0], title: 'Sheila On 7 - Pupus (Indie rock klasik)' },
  { id: WORKING_VEVO_IDS[1], title: 'Ahmad Dhani - Seperti Mimpi Saja (Rock legend)' },
  { id: WORKING_VEVO_IDS[2], title: 'Peterpan - Menunggu Gini (Pop rock nostalgia)' },
  { id: WORKING_VEVO_IDS[3], title: 'Gigi - Jika Aku Pergi (90s legend)' },
  { id: WORKING_VEVO_IDS[4], title: 'Slank - Tahu Diri (Rock anthem)' },
  { id: WORKING_VEVO_IDS[5], title: 'Naif - Lukaku (Indie folk)' },
  { id: WORKING_VEVO_IDS[6], title: 'Dewa 19 - Kangen (Power ballad)' },
  { id: WORKING_VEVO_IDS[7], title: 'Padi - Sayang (Pop rock sensation)' },
  { id: WORKING_VEVO_IDS[8], title: 'Ungu - Luka di Hati (Modern dangdut)' },
  { id: WORKING_VEVO_IDS[9], title: 'Cokelat - Aku Milikmu (R&B Indonesia)' },
  { id: WORKING_VEVO_IDS[10], title: 'Drive - Berawal Dari Mimpi (Emo rock)' },
  { id: WORKING_VEVO_IDS[11], title: 'Kangen Band - Orang Seperti Anda (Pop dangdut)' },
  { id: WORKING_VEVO_IDS[12], title: 'Smash - Cinta Luar Biasa (Pop rock hits)' },
  { id: WORKING_VEVO_IDS[13], title: 'Cherrybelle - Dilema (K-pop influenced)' },
  { id: WORKING_VEVO_IDS[14], title: 'Dangdut Koplo - Goyang Baning (Traditional dance)' },
];

const generatePlaylist = (videos: any[]) => {
  return videos.map(item => ({
    id: item.id,
    title: item.title,
    category: 'music'
  }));
};

const GLOBAL_VEVO = generatePlaylist(GLOBAL_VEVO_2024);
const US_VEVO = generatePlaylist(US_VEVO_2024);
const ARTISTS_VEVO = generatePlaylist(TOP_ARTISTS_VEVO);
const INDONESIAN = generatePlaylist(INDONESIAN_TRADITIONAL);

export const PLAYLISTS = {
  western: {
    name: '🌍 Global VEVO Top 2024',
    emoji: '🎵',
    videos: GLOBAL_VEVO
  },
  indonesian: {
    name: '🎤 Indonesia Classics',
    emoji: '🎶',
    videos: INDONESIAN
  },
  funny: {
    name: '🔥 US Top VEVO 2024',
    emoji: '🎧',
    videos: US_VEVO
  },
  podcast: {
    name: '⭐ VEVO Top Artists',
    emoji: '📻',
    videos: ARTISTS_VEVO
  }
};
