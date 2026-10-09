import { useEffect, useMemo, useState } from 'react';
import { songNameAliases } from '../song-aliases';
import { Song, SortConfig } from '../types';
import { DIFFICULTY_ORDER } from '../utils/difficulty';

// Add characters to this regex to ignore them in search.
// For example, to ignore dots and dashes: /[.-]/g
const IGNORED_SEARCH_CHARS_REGEX = /\./g;

/**
 * Normalizes a string for searching by removing ignored characters and converting to lowercase.
 * @param str The string to normalize.
 * @returns The normalized string.
 */
const normalizeSearchString = (str: string): string => {
    return str.replace(IGNORED_SEARCH_CHARS_REGEX, '').toLowerCase();
};

const parseDifficulty = (value?: string): number | null => {
    if (!value) return null;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
};

// Sort button cycles through these in order.
export const SORT_CYCLE: { config: SortConfig; label: string }[] = [
    { config: { type: 'alphanumerical', direction: 'asc' }, label: 'A–Z' },
    { config: { type: 'alphanumerical', direction: 'desc' }, label: 'Z–A' },
    { config: { type: 'unsorted', direction: 'asc' }, label: 'Default' },
    { config: { type: 'unsorted', direction: 'desc' }, label: 'Reverse' },
];

export const getSortIndex = (sortConfig: SortConfig): number =>
    Math.max(0, SORT_CYCLE.findIndex(s => s.config.type === sortConfig.type && s.config.direction === sortConfig.direction));

const hasAt = (song: Song): boolean => !!(song.charters?.AT || song.difficulties?.AT);

/** Search, "Has AT" and difficulty range filtering for the song list. */
export const useSongFilter = (songs: Song[]) => {
    const [minInput, setMinInput] = useState('');
    const [maxInput, setMaxInput] = useState('');
    const [onlyHasAt, setOnlyHasAt] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 200);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Overall difficulty bounds from difficulty.tsv, used for the filter inputs.
    const difficultyBounds = useMemo(() => {
        let min = Infinity;
        let max = -Infinity;
        for (const song of songs) {
            for (const level of DIFFICULTY_ORDER) {
                const d = parseDifficulty(song.difficulties?.[level]);
                if (d === null) continue;
                if (d < min) min = d;
                if (d > max) max = d;
            }
        }
        if (min === Infinity) return null;
        return { min, max };
    }, [songs]);

    const parsedMin = parseDifficulty(minInput);
    const parsedMax = parseDifficulty(maxInput);
    const isRangeActive = difficultyBounds !== null && (
        (parsedMin !== null && parsedMin > difficultyBounds.min) ||
        (parsedMax !== null && parsedMax < difficultyBounds.max)
    );
    const isFilterActive = onlyHasAt || isRangeActive;

    const filteredSongs = useMemo(() => {
        if (!isFilterActive) return songs;
        const lo = parsedMin ?? -Infinity;
        const hi = parsedMax ?? Infinity;
        // A song is kept if it passes the AT toggle and at least one level has a difficulty within range.
        return songs.filter(song => {
            if (onlyHasAt && !hasAt(song)) return false;
            if (!isRangeActive) return true;
            return DIFFICULTY_ORDER.some(level => {
                const d = parseDifficulty(song.difficulties?.[level]);
                return d !== null && d >= lo && d <= hi;
            });
        });
    }, [songs, isFilterActive, isRangeActive, parsedMin, parsedMax, onlyHasAt]);

    const aliasList = useMemo(() => {
        const list: { alias: string, song: Song }[] = [];
        if (filteredSongs.length > 0) {
            for (const songName in songNameAliases) {
                const song = filteredSongs.find(s => s.name === songName);
                if (song) {
                    const aliases = songNameAliases[songName];
                    for (const alias of aliases) {
                        list.push({ alias: alias.toLowerCase(), song });
                    }
                }
            }
        }
        return list;
    }, [filteredSongs]);

    const { displayedSongs, isSuggestion } = useMemo(() => {
        if (!debouncedSearchTerm) {
            return { displayedSongs: filteredSongs, isSuggestion: false };
        }
        const normalizedSearchTerm = normalizeSearchString(debouncedSearchTerm);

        const directMatches = filteredSongs.filter(song =>
            normalizeSearchString(song.name).includes(normalizedSearchTerm) ||
            normalizeSearchString(song.composer).includes(normalizedSearchTerm)
        );

        if (directMatches.length > 0) {
            return { displayedSongs: directMatches, isSuggestion: false };
        }

        // No direct matches, check aliases.
        const aliasMatches = aliasList
            .filter(item => normalizeSearchString(item.alias).includes(normalizedSearchTerm))
            .map(item => item.song);

        if (aliasMatches.length > 0) {
            const uniqueAliasMatches = Array.from(new Map(aliasMatches.map(song => [song.id, song])).values());
            return { displayedSongs: uniqueAliasMatches, isSuggestion: true };
        }

        return { displayedSongs: [], isSuggestion: false };
    }, [filteredSongs, debouncedSearchTerm, aliasList]);

    const rangeLabel = difficultyBounds
        ? `${(parsedMin ?? difficultyBounds.min).toFixed(1)}–${(parsedMax ?? difficultyBounds.max).toFixed(1)}`
        : '–';

    return {
        searchTerm, setSearchTerm,
        minInput, setMinInput,
        maxInput, setMaxInput,
        onlyHasAt, setOnlyHasAt,
        difficultyBounds, isRangeActive, rangeLabel,
        displayedSongs, isSuggestion,
    };
};

export type SongFilter = ReturnType<typeof useSongFilter>;
