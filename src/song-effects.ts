
export type SongEffectType = 'glitch' | 'luminescence' | 'cracking' | 'distorted-fate' | null;

export const getSongEffect = (songName: string): SongEffectType => {
  // Mapping of song names to their specific effects.
  const effects: Record<string, SongEffectType> = {
    'DESTRUCTION 3,2,1': 'glitch',
    '+ERABY+E CONNEC+10N': 'glitch',
    'Aleph-0': 'glitch',
    'Luminescence': 'luminescence',
  };

  return effects[songName] || null;
};
