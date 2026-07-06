
export interface BlacklistEntry {
  songId: string;
  difficulty: string;
  reason?: string;
}

export const blacklist: BlacklistEntry[] = [
  {
    songId: 'StardustRAY.kanonevsBlackY',
    difficulty: 'IN',
    reason: "This chart causes Phira to become unresponsive on all devices upon pressing 'Play'."
  },
  {
    songId:'彩.MisoilePunch',
    difficulty: 'IN',
    reason: "This chart causes Phira to become unresponsive on all devices upon pressing 'Play'."
  },
];

export const isBlacklisted = (songId: string, difficulty: string): BlacklistEntry | undefined => {
  return blacklist.find(entry => entry.songId === songId && entry.difficulty === difficulty);
};
