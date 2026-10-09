// Charts that exist in the chart branch but are not listed by the metadata (info/difficulty.tsv).
export interface ExtraChartEntry {
  songId: string;
  difficulty: string;
  level: string;
  tooltip?: string;
}

export const extraCharts: ExtraChartEntry[] = [
  {
    songId: 'Message.くるぶっこちゃん',
    difficulty: 'SP',
    level: '?',
    tooltip: 'The alternate version of the chart played during the initial Chapter 9 playthrough.'
  }
];

export const getExtraCharts = (songId: string): ExtraChartEntry[] => {
  return extraCharts.filter(entry => entry.songId === songId);
};

export const getExtraChart = (songId: string, difficulty: string): ExtraChartEntry | undefined => {
  return extraCharts.find(entry => entry.songId === songId && entry.difficulty === difficulty);
};
