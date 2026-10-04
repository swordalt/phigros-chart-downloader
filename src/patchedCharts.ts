
export interface PatchedChartEntry {
  songId: string;
  difficulty: string;
  url: string;
  fileName: string;
  reason?: string;
}

export const patchedCharts: PatchedChartEntry[] = [
  {
    songId: 'ハテ.rNFrums',
    difficulty: 'AT',
    url: 'https://raw.githubusercontent.com/swordalt/phigros-patched-charts/refs/heads/main/mainStory/%E3%83%8F%E3%83%86-AT-fixed.pez',
    fileName: 'ハテ-AT-fixed.pez',
    reason: 'The original chart is unplayable since there are no red block indicators. This fix moves all notes near the end to Line 0, avoiding the issue entirely.'
  }
];

export const getPatchedChart = (songId: string, difficulty: string): PatchedChartEntry | undefined => {
  return patchedCharts.find(entry => entry.songId === songId && entry.difficulty === difficulty);
};
