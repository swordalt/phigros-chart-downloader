import { songNameAliases } from '../song-aliases';
import { Song } from '../types';

/**
 * Builds the full contents of song-aliases.ts: every existing alias entry is kept,
 * and songs missing from the file are appended with an empty alias placeholder.
 */
export const generateSongAliasesFile = (songs: Song[]): string => {
  const entries: Record<string, string[]> = { ...songNameAliases };
  for (const song of songs) {
    if (!(song.name in entries)) {
      entries[song.name] = [''];
    }
  }

  const body = Object.entries(entries)
    .map(([name, aliases]) => `  ${JSON.stringify(name)}: [\n    ${aliases.map(a => JSON.stringify(a)).join(',')}\n  ]`)
    .join(',\n');

  return `\nexport const songNameAliases: Record<string, string[]> = {\n${body}\n};`;
};

/**
 * Exposes `generateSongAliases()` on window for use from the browser dev console.
 * Logs the generated file and returns it as a string.
 */
export const registerSongAliasesConsoleHelper = (songs: Song[]) => {
  (window as any).generateSongAliases = () => {
    const output = generateSongAliasesFile(songs);
    const added = songs.filter(s => !(s.name in songNameAliases)).map(s => s.name);
    console.log(`song-aliases.ts: ${Object.keys(songNameAliases).length} existing entries, ${added.length} new song(s) added${added.length ? ': ' + added.join(', ') : ''}`);
    console.log(output);
    return output;
  };
};
