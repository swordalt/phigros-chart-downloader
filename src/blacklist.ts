
export interface BlacklistEntry {
  songId: string;
  difficulty: string;
  reason?: string;
}

export const blacklist: BlacklistEntry[] = [
  {
    songId: 'placeholder',
    difficulty: 'IN',
    reason: "Placeholder text."
  }
];

export const isBlacklisted = (songId: string, difficulty: string): BlacklistEntry | undefined => {
  return blacklist.find(entry => entry.songId === songId && entry.difficulty === difficulty);
};
