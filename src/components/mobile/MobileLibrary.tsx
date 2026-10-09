import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from '../Spinner';
import { ErrorIcon, MagnifyingGlassIcon, ChevronDownIcon } from '../Icons';
import { useSettings } from '../../contexts/SettingsContext';
import { Song, SortConfig } from '../../types';
import { getBlurIllustrationUrl } from '../../utils/resourceUrls';
import { SongFilter, SORT_CYCLE, getSortIndex } from '../../hooks/useSongFilter';

interface MobileLibraryProps {
    filter: SongFilter;
    isLoading: boolean;
    error: string | null;
    selectedSong: Song | null;
    onOpenSong: (song: Song) => void;
    sortConfig: SortConfig;
    onSortConfigChange: (config: SortConfig) => void;
    onOpenMenu: () => void;
    onOpenRange: () => void;
    /** Replaces the list, filters and search while bulk download mode is on. */
    bulkPanel?: React.ReactNode;
}

const ROW_HEIGHT = 60;

const SongThumbnail: React.FC<{ src: string }> = ({ src }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    return (
        <span className="relative w-16 h-9 flex-none rounded-md overflow-hidden bg-[repeating-linear-gradient(135deg,#1e293b_0_4px,#172033_4px_8px)]">
            {!failed && (
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </span>
    );
};

const chip = 'flex-none h-[34px] rounded-[17px] border flex items-center transition-colors';

export const MobileLibrary: React.FC<MobileLibraryProps> = ({
    filter,
    isLoading,
    error,
    selectedSong,
    onOpenSong,
    sortConfig,
    onSortConfigChange,
    onOpenMenu,
    onOpenRange,
    bulkPanel,
}) => {
    const { settings } = useSettings();
    const { searchTerm, setSearchTerm, onlyHasAt, setOnlyHasAt, isRangeActive, rangeLabel, displayedSongs, isSuggestion } = filter;
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: displayedSongs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 6,
    });

    const sortIndex = getSortIndex(sortConfig);
    const cycleSort = () => onSortConfigChange(SORT_CYCLE[(sortIndex + 1) % SORT_CYCLE.length].config);

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400">
                    <Spinner />
                    <span>Loading song list…</span>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center gap-2 text-center px-6 py-12">
                    <span className="flex items-center gap-2 text-[#f87171] text-sm font-semibold"><ErrorIcon className="w-5 h-5" />Failed to load songs</span>
                    <p className="font-mono text-[11px] text-slate-500 break-all">{error}</p>
                </div>
            );
        }
        if (displayedSongs.length === 0) {
            return <p className="px-4 py-12 text-center text-sm text-slate-500">No songs found.</p>;
        }
        return (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map(virtualItem => {
                    const song = displayedSongs[virtualItem.index];
                    const selected = selectedSong?.id === song.id;
                    return (
                        <button
                            key={song.id}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => onOpenSong(song)}
                            className={`absolute left-0 top-0 w-full h-[60px] flex items-center gap-3 px-2.5 rounded-[10px] text-left ${selected ? 'bg-[rgba(34,211,238,0.10)]' : 'active:bg-white/[.04]'}`}
                            style={{ transform: `translateY(${virtualItem.start}px)` }}
                        >
                            <SongThumbnail src={getBlurIllustrationUrl(settings.proxySource, song.id)} />
                            <span className="flex-1 min-w-0 flex flex-col gap-px">
                                <span className={`text-[15px] leading-[1.25] truncate ${selected ? 'text-white' : 'text-slate-300'}`}>{song.name}</span>
                                <span className="text-xs leading-[1.3] text-slate-500 truncate">{song.composer}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 flex flex-col bg-black">
            <div className="flex-none bg-[#10141d] border-b border-white/[.1]">
                <header className="h-[52px] flex items-center justify-between gap-3 pl-[18px] pr-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-4 h-4 flex-none bg-[#22d3ee] -skew-x-[14deg]" aria-hidden="true" />
                        <h1 className="font-semibold text-[13px] tracking-[.16em] text-slate-100 truncate">PHIGROS CHART DOWNLOADER</h1>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenMenu}
                        aria-label="Menu"
                        className="w-11 h-11 flex-none flex items-center justify-center rounded-xl text-slate-300 active:bg-white/[.05]"
                    >
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                    </button>
                </header>

                {!bulkPanel && (
                    <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
                        <button
                            type="button"
                            aria-pressed={onlyHasAt}
                            onClick={() => setOnlyHasAt(v => !v)}
                            className={`${chip} gap-1.5 px-3 font-mono text-xs font-semibold ${onlyHasAt ? 'border-[rgba(74,222,128,.35)] bg-[rgba(74,222,128,.12)] text-[#4ade80]' : 'border-white/[.08] text-slate-200'}`}
                        >
                            Has AT
                        </button>
                        <button
                            type="button"
                            onClick={onOpenRange}
                            aria-label={`Difficulty range ${rangeLabel}`}
                            className={`${chip} gap-1 pl-3 pr-2.5 font-mono text-xs font-medium ${isRangeActive ? 'border-[rgba(34,211,238,.4)] bg-[rgba(34,211,238,.1)] text-[#22d3ee]' : 'border-white/[.08] text-slate-400'}`}
                        >
                            Lv {rangeLabel}
                            <ChevronDownIcon className="w-3 h-3 [stroke-width:2]" />
                        </button>
                        <button
                            type="button"
                            onClick={cycleSort}
                            aria-label={`Sort order: ${SORT_CYCLE[sortIndex].label}`}
                            className={`${chip} gap-[5px] px-3 border-white/[.08] text-xs font-medium text-slate-400`}
                        >
                            {SORT_CYCLE[sortIndex].label}
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                        </button>
                        <span className="flex-1" />
                        <span className="flex-none font-mono text-[10px] font-medium tracking-[.12em] text-slate-600 whitespace-nowrap">
                            {isSuggestion && <span className="text-[#22d3ee]">DID YOU MEAN · </span>}
                            {isLoading ? '—' : `${displayedSongs.length} SONGS`}
                        </span>
                    </div>
                )}
            </div>

            {bulkPanel ? (
                <div className="flex-1 min-h-0">{bulkPanel}</div>
            ) : (
                <>
                    <div ref={parentRef} role="listbox" aria-label="Songs" className="flex-1 min-h-0 overflow-y-auto px-2 pt-1.5 pb-6">
                        {renderList()}
                    </div>

                    <div className="flex-none px-4 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))] bg-[#10141d] border-t border-white/[.1]">
                        <label className="h-12 flex items-center gap-2.5 px-3.5 rounded-[14px] bg-white/[.05] border border-white/[.08] focus-within:border-[rgba(34,211,238,.45)] transition-colors">
                            <MagnifyingGlassIcon className="w-[18px] h-[18px] flex-none text-slate-500" />
                            <input
                                type="text"
                                enterKeyHint="search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                        if (displayedSongs.length > 0) onOpenSong(displayedSongs[0]);
                                    }
                                }}
                                placeholder="Search songs or artists"
                                aria-label="Search songs, artists or aliases"
                                className="flex-1 min-w-0 bg-transparent text-base text-slate-200 placeholder:text-slate-500 focus:outline-none"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                    className="w-8 h-8 -mr-1.5 flex-none flex items-center justify-center text-slate-500"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </label>
                    </div>
                </>
            )}
        </div>
    );
};
