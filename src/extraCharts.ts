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
    tooltip: 'The version of the chart played during the first playthrough.'
  }
];

export const getExtraCharts = (songId: string): ExtraChartEntry[] => {
  return extraCharts.filter(entry => entry.songId === songId);
};

export const getExtraChart = (songId: string, difficulty: string): ExtraChartEntry | undefined => {
  return extraCharts.find(entry => entry.songId === songId && entry.difficulty === difficulty);
};
