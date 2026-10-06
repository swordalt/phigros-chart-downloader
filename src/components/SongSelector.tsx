
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from './Spinner';
import { CustomScrollbar } from './CustomScrollbar';
import { songNameAliases } from '../song-aliases';
import { useSettings } from '../contexts/SettingsContext';
import { getSongEffect } from '../song-effects';
import { Song, SortConfig, SortType, SortDirection } from '../types';
import { ChevronDownIcon, ErrorIcon, MagnifyingGlassIcon, ArrowsUpDownIcon, CheckIcon, FunnelIcon } from './Icons';

interface SongSelectorProps {
  isLoading: boolean;
  error: string | null;
  songs: Song[];
  selectedSong: Song | null;
  onSongSelect: (song: Song | null) => void;
  sortConfig: SortConfig;
  onSortConfigChange: (config: SortConfig) => void;
}

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

const LEVELS = ['EZ', 'HD', 'IN', 'AT'] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS: Record<Level, string> = {
    EZ: 'text-green-400',
    HD: 'text-sky-400',
    IN: 'text-red-400',
    AT: 'text-slate-200',
};

const parseDifficulty = (value?: string): number | null => {
    if (!value) return null;
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
};

export const SongSelector: React.FC<SongSelectorProps> = ({ isLoading, error, songs, selectedSong, onSongSelect, sortConfig, onSortConfigChange }) => {
    const { settings } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [minInput, setMinInput] = useState('');
    const [maxInput, setMaxInput] = useState('');
    const [enabledLevels, setEnabledLevels] = useState<Record<Level, boolean>>({ EZ: true, HD: true, IN: true, AT: true });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const sortWrapperRef = useRef<HTMLDivElement>(null);
    const filterWrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLUListElement>(null);

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
            for (const level of LEVELS) {
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
    const allLevelsEnabled = LEVELS.every(level => enabledLevels[level]);
    const isFilterActive = !allLevelsEnabled ||
        (difficultyBounds !== null && (
            (parsedMin !== null && parsedMin > difficultyBounds.min) ||
            (parsedMax !== null && parsedMax < difficultyBounds.max)
        ));

    const filteredSongs = useMemo(() => {
        if (!isFilterActive) return songs;
        const lo = parsedMin ?? -Infinity;
        const hi = parsedMax ?? Infinity;
        // A song is kept if at least one enabled level has a difficulty within range.
        return songs.filter(song => LEVELS.some(level => {
            if (!enabledLevels[level]) return false;
            const d = parseDifficulty(song.difficulties?.[level]);
            return d !== null && d >= lo && d <= hi;
        }));
    }, [songs, isFilterActive, parsedMin, parsedMax, enabledLevels]);

    const toggleLevel = (level: Level) => {
        setEnabledLevels(prev => ({ ...prev, [level]: !prev[level] }));
    };

    const resetFilter = () => {
        setMinInput('');
        setMaxInput('');
        setEnabledLevels({ EZ: true, HD: true, IN: true, AT: true });
    };

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
            normalizeSearchString(song.name).includes(normalizedSearchTerm)
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


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close song selector if clicked outside of it AND outside of the sort/filter buttons
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node) &&
                sortWrapperRef.current &&
                !sortWrapperRef.current.contains(event.target as Node) &&
                filterWrapperRef.current &&
                !filterWrapperRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
            
            // Close sort popup if clicked outside of it
            if (sortWrapperRef.current && !sortWrapperRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }

            // Close filter popup if clicked outside of it
            if (filterWrapperRef.current && !filterWrapperRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, sortWrapperRef, filterWrapperRef]);
    
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const rowVirtualizer = useVirtualizer({
        count: displayedSongs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44, // Approximate height of a list item (py-2.5 is 10px top/bottom + line height)
        overscan: 5, // Add a bit of overhead to prevent visual glitches
    });

    const handleSelectSong = (song: Song) => {
        onSongSelect(song);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleSortTypeChange = (type: SortType) => {
        onSortConfigChange({ ...sortConfig, type });
        // setIsSortOpen(false); // Keep open to allow changing direction too if desired
    };

    const handleSortDirectionChange = (direction: SortDirection) => {
        onSortConfigChange({ ...sortConfig, direction });
        // setIsSortOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-3 text-slate-400 h-14 w-full max-w-lg">
                <Spinner />
                <span>Loading song list...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-red-400 h-14 w-full max-w-lg">
                <div className="flex items-center gap-2">
                    <ErrorIcon className="w-6 h-6" />
                    <span className="font-semibold">Failed to load songs</span>
                </div>
                <p className="text-xs text-red-500">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="flex items-center gap-2 w-full max-w-lg mx-auto">
            <div ref={wrapperRef} className="relative flex-grow">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full h-14 px-4 text-left rounded-xl border border-slate-700 bg-slate-800/50 shadow-lg backdrop-blur-sm hover:bg-slate-800/80 transition-colors duration-200"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className={`truncate ${selectedSong ? 'text-slate-100' : 'text-slate-400'}`}>
                        {selectedSong ? selectedSong.name : 'Select a Song'}
                    </span>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div 
                        className="motion-dropdown absolute z-40 w-full mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl"
                    >
                        <div className="p-2 border-b border-slate-700">
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search for a song..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-700/50 rounded-lg border-none pl-10 pr-4 py-2 text-slate-200 focus:ring-2 focus:ring-brand-cyan focus:outline-none"
                                />
                            </div>
                        </div>
                        {isSuggestion && displayedSongs.length > 0 && (
                            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 tracking-wide bg-slate-800 border-b border-slate-700">
                                Did you mean:
                            </div>
                        )}
                        <div className="relative">
                            <ul ref={parentRef} className="max-h-60 overflow-y-auto relative" role="listbox">
                                {displayedSongs.length > 0 ? (
                                    <div
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            width: '100%',
                                            position: 'relative',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                            const song = displayedSongs[virtualItem.index];
                                            const hasEffect = settings.useNewUi && settings.newUiSongSpecificEffects && getSongEffect(song.name);
                                            return (
                                                <li
                                                    key={virtualItem.key}
                                                    className="px-4 py-2.5 cursor-pointer text-slate-300 hover:bg-brand-cyan/20 hover:text-white transition-colors duration-150 flex items-center justify-between absolute top-0 left-0 w-full"
                                                    style={{
                                                        height: `${virtualItem.size}px`,
                                                        transform: `translateY(${virtualItem.start}px)`,
                                                    }}
                                                    onClick={() => handleSelectSong(song)}
                                                    role="option"
                                                    aria-selected={selectedSong?.id === song.id}
                                                >
                                                    <span>{song.name}</span>
                                                    {hasEffect && <span className="text-yellow-400 text-sm ml-2">✨</span>}
                                                </li>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <li className="px-4 py-3 text-center text-slate-500">No songs found.</li>
                                )}
                            </ul>
                            <CustomScrollbar scrollRef={parentRef} watch={displayedSongs.length} />
                        </div>
                    </div>
                )}
            </div>

            <div ref={filterWrapperRef} className="relative">
                <button
                    type="button"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`relative flex items-center justify-center w-14 h-14 rounded-xl border border-slate-700 shadow-lg backdrop-blur-sm transition-colors duration-200 flex-shrink-0 ${isFilterOpen ? 'bg-slate-700 text-slate-200' : 'bg-slate-800/50 hover:bg-slate-800/80 text-slate-400'}`}
                    title="Filter Options"
                    aria-haspopup="true"
                    aria-expanded={isFilterOpen}
                >
                    <FunnelIcon className="w-6 h-6" />
                    {isFilterActive && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-cyan" />}
                    <span className="sr-only">Filter Options</span>
                </button>

                {isFilterOpen && (
                    <div className="motion-dropdown absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
                        <div className="py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Difficulty Range
                            </div>
                            <div className="flex items-center gap-2 px-4 pb-2">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step={0.1}
                                    min={difficultyBounds?.min}
                                    max={difficultyBounds?.max}
                                    placeholder={difficultyBounds ? String(difficultyBounds.min) : 'Min'}
                                    value={minInput}
                                    onChange={(e) => setMinInput(e.target.value)}
                                    disabled={!difficultyBounds}
                                    className="w-full min-w-0 bg-slate-700/50 rounded-lg border-none px-2 py-1.5 text-sm text-slate-200 text-center focus:ring-2 focus:ring-brand-cyan focus:outline-none disabled:opacity-50"
                                    aria-label="Minimum difficulty"
                                />
                                <span className="text-slate-500">–</span>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step={0.1}
                                    min={difficultyBounds?.min}
                                    max={difficultyBounds?.max}
                                    placeholder={difficultyBounds ? String(difficultyBounds.max) : 'Max'}
                                    value={maxInput}
                                    onChange={(e) => setMaxInput(e.target.value)}
                                    disabled={!difficultyBounds}
                                    className="w-full min-w-0 bg-slate-700/50 rounded-lg border-none px-2 py-1.5 text-sm text-slate-200 text-center focus:ring-2 focus:ring-brand-cyan focus:outline-none disabled:opacity-50"
                                    aria-label="Maximum difficulty"
                                />
                            </div>

                            <div className="my-1 border-t border-slate-700"></div>

                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Level
                            </div>
                            {LEVELS.map(level => (
                                <button
                                    key={level}
                                    onClick={() => toggleLevel(level)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between transition-colors duration-150"
                                    role="menuitemcheckbox"
                                    aria-checked={enabledLevels[level]}
                                >
                                    <span className={`font-bold ${LEVEL_COLORS[level]}`}>{level}</span>
                                    <span className={`flex items-center justify-center w-4 h-4 rounded border ${enabledLevels[level] ? 'border-brand-cyan bg-brand-cyan/20' : 'border-slate-500'}`}>
                                        {enabledLevels[level] && <CheckIcon className="w-3 h-3 text-brand-cyan" />}
                                    </span>
                                </button>
                            ))}

                            <div className="my-1 border-t border-slate-700"></div>

                            <button
                                onClick={resetFilter}
                                disabled={!isFilterActive && !minInput && !maxInput}
                                className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div ref={sortWrapperRef} className="relative">
                <button
                    type="button"
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`flex items-center justify-center w-14 h-14 rounded-xl border border-slate-700 shadow-lg backdrop-blur-sm transition-colors duration-200 flex-shrink-0 ${isSortOpen ? 'bg-slate-700 text-slate-200' : 'bg-slate-800/50 hover:bg-slate-800/80 text-slate-400'}`}
                    title="Sort Options"
                    aria-haspopup="true"
                    aria-expanded={isSortOpen}
                >
                    <ArrowsUpDownIcon className="w-6 h-6" />
                    <span className="sr-only">Sort Options</span>
                </button>

                {isSortOpen && (
                    <div className="motion-dropdown absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-800 shadow-2xl overflow-hidden">
                        <div className="py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Sort By
                            </div>
                            <button
                                onClick={() => handleSortTypeChange('alphanumerical')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between transition-colors duration-150"
                            >
                                <span>Alphanumerical</span>
                                {sortConfig.type === 'alphanumerical' && <CheckIcon className="w-4 h-4 text-brand-cyan" />}
                            </button>
                            <button
                                onClick={() => handleSortTypeChange('unsorted')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between transition-colors duration-150"
                            >
                                <span>Unsorted</span>
                                {sortConfig.type === 'unsorted' && <CheckIcon className="w-4 h-4 text-brand-cyan" />}
                            </button>
                            
                            <div className="my-1 border-t border-slate-700"></div>
                            
                            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Order
                            </div>
                            <button
                                onClick={() => handleSortDirectionChange('asc')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between transition-colors duration-150"
                            >
                                <span>Ascending</span>
                                {sortConfig.direction === 'asc' && <CheckIcon className="w-4 h-4 text-brand-cyan" />}
                            </button>
                            <button
                                onClick={() => handleSortDirectionChange('desc')}
                                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-between transition-colors duration-150"
                            >
                                <span>Descending</span>
                                {sortConfig.direction === 'desc' && <CheckIcon className="w-4 h-4 text-brand-cyan" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
