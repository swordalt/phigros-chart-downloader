import React, { useCallback, useEffect, useState } from 'react';
import { Song, SortConfig, FileInfo } from '../../types';
import { ExportState } from '../SongWorkspace';
import { MobileLibrary } from './MobileLibrary';
import { MobileSongView } from './MobileSongView';
import { BottomSheet } from './BottomSheet';
import { useSongFilter } from '../../hooks/useSongFilter';
import { useSettings } from '../../contexts/SettingsContext';
import { PROXY_SOURCES } from '../../utils/resourceUrls';
import { faqData } from '../../faqData';

const REPO_URL = 'https://github.com/swordalt/phigros-chart-downloader/';
// Marks the history entry pushed when a song page opens, so the system back gesture returns to the list.
const HISTORY_KEY = 'pcdSongView';

type Sheet = 'menu' | 'range';

interface MobileLayoutProps {
    songs: Song[];
    isLoadingSongs: boolean;
    errorSongs: string | null;
    selectedSong: Song | null;
    onSongSelect: (song: Song) => void;
    sortConfig: SortConfig;
    onSortConfigChange: (config: SortConfig) => void;

    version: string | null;
    isLoadingVersion: boolean;
    versionError: string | null;
    onRetryVersion: () => void;
    onAboutClick: () => void;
    onFaqClick: () => void;
    onSettingsClick: () => void;

    bgImage: string | null;
    isBgLoaded: boolean;
    audio: HTMLAudioElement | null;
    files: FileInfo[];
    isLoadingFiles: boolean;
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
    exportState: ExportState;
    onExportChart: () => void;
    onExportAllAssets: () => void;
    onDownloaded: (fileName: string) => void;

    bulkPanel: React.ReactNode | null;
    toast: { id: number; text: string } | null;
}

const eyebrow = 'font-mono text-[10px] font-medium tracking-[.16em] text-[#22d3ee]';

/** Phone layout: the library gets the full height and a song opens as a pushed page. */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
    songs,
    isLoadingSongs,
    errorSongs,
    selectedSong,
    onSongSelect,
    sortConfig,
    onSortConfigChange,
    version,
    isLoadingVersion,
    versionError,
    onRetryVersion,
    onAboutClick,
    onFaqClick,
    onSettingsClick,
    audio,
    bulkPanel,
    toast,
    ...songViewProps
}) => {
    const { settings } = useSettings();
    const filter = useSongFilter(songs);
    const [songOpen, setSongOpen] = useState(selectedSong !== null);
    const [sheet, setSheet] = useState<Sheet | null>(null);
    // Keeps the closing sheet's content rendered while it slides out.
    const [lastSheet, setLastSheet] = useState<Sheet>('menu');

    const openSheet = (s: Sheet) => {
        setLastSheet(s);
        setSheet(s);
    };
    const closeSheet = useCallback(() => setSheet(null), []);

    // A song selected from elsewhere (e.g. ?song= in the URL) opens its page.
    useEffect(() => {
        if (selectedSong) setSongOpen(true);
    }, [selectedSong]);

    // The preview only plays on the song page; this also catches an audio element recreated while on the list.
    useEffect(() => {
        if (!songOpen) audio?.pause();
    }, [audio, songOpen]);

    const closeSong = useCallback(() => setSongOpen(false), []);

    useEffect(() => {
        const handlePop = () => closeSong();
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [closeSong]);

    const openSong = (song: Song) => {
        if (!songOpen) window.history.pushState({ [HISTORY_KEY]: true }, '');
        if (song.id === selectedSong?.id) {
            // Same song again: its audio element is reused, so restart the preview by hand.
            if (audio && settings.newUiAudioPreview) {
                audio.currentTime = 0;
                audio.play().catch(err => console.warn('Could not play audio:', err));
            }
        } else {
            onSongSelect(song);
        }
        setSongOpen(true);
    };

    const goBack = () => {
        if (window.history.state?.[HISTORY_KEY]) window.history.back();
        else closeSong();
    };

    const openDialog = (open: () => void) => {
        setSheet(null);
        open();
    };

    const dot = versionError ? '#f87171' : isLoadingVersion ? '#fbbf24' : '#4ade80';
    const versionLabel = versionError ? 'Failed · retry' : isLoadingVersion ? 'Loading …' : `Phigros v${version}`;
    const proxyLabel = PROXY_SOURCES.find(p => p.id === settings.proxySource)?.label ?? '';

    const menuItems: { label: string; meta: string; onClick: () => void }[] = [
        { label: 'About', meta: '', onClick: () => openDialog(onAboutClick) },
        { label: 'FAQ', meta: String(faqData.length), onClick: () => openDialog(onFaqClick) },
        { label: 'Settings', meta: proxyLabel, onClick: () => openDialog(onSettingsClick) },
    ];

    const { minInput, setMinInput, maxInput, setMaxInput, difficultyBounds, displayedSongs } = filter;
    const rangeInput = 'w-full h-12 rounded-[10px] bg-white/[.04] border border-white/[.08] text-center font-mono text-base font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[rgba(34,211,238,.45)] disabled:opacity-50';

    const renderMenu = () => (
        <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
                <span id="mobile-sheet-title" className={eyebrow}>MENU</span>
                <button
                    type="button"
                    onClick={versionError ? onRetryVersion : undefined}
                    disabled={!versionError}
                    title={versionError ?? 'The game version assets are decompiled from'}
                    className="flex items-center gap-2 px-3 py-[5px] rounded-full border border-white/[.08] font-mono text-[11px] font-medium text-slate-400 whitespace-nowrap"
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${isLoadingVersion ? 'animate-pulse' : ''}`} style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
                    {versionLabel}
                </button>
            </div>
            <div className="flex flex-col rounded-[14px] border border-white/[.07] bg-white/[.02] overflow-hidden">
                {menuItems.map((item, i) => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={item.onClick}
                        className={`h-14 flex items-center gap-3.5 px-4 text-left text-[15px] text-slate-200 active:bg-white/[.04] ${i ? 'border-t border-white/[.06]' : ''}`}
                    >
                        <span className="flex-1">{item.label}</span>
                        <span className="font-mono text-[11px] font-medium text-slate-500">{item.meta}</span>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#475569"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                ))}
            </div>
            <p className="text-xs leading-[1.5] text-slate-500 text-center">
                Source code can be found on <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">GitHub</a>. All assets belong to their respective copyright holders.
            </p>
        </div>
    );

    const renderRange = () => (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
                <span className={eyebrow}>DIFFICULTY RANGE</span>
                <span id="mobile-sheet-title" className="text-[21px] font-semibold text-slate-100">Filter by level</span>
            </div>
            <div className="flex items-center gap-2.5">
                {[
                    { label: 'MIN', value: minInput, set: setMinInput, placeholder: difficultyBounds?.min },
                    { label: 'MAX', value: maxInput, set: setMaxInput, placeholder: difficultyBounds?.max },
                ].map((field, i) => (
                    <React.Fragment key={field.label}>
                        {i === 1 && <span className="pt-5 text-slate-600">–</span>}
                        <label className="flex-1 flex flex-col gap-1.5">
                            <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">{field.label}</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                step={0.1}
                                min={difficultyBounds?.min}
                                max={difficultyBounds?.max}
                                value={field.value}
                                onChange={e => field.set(e.target.value)}
                                placeholder={field.placeholder !== undefined ? String(field.placeholder) : ''}
                                disabled={!difficultyBounds}
                                className={rangeInput}
                            />
                        </label>
                    </React.Fragment>
                ))}
            </div>
            <div className="flex gap-2.5">
                <button
                    type="button"
                    onClick={() => { setMinInput(''); setMaxInput(''); }}
                    className="h-12 px-[18px] rounded-[10px] border border-white/[.12] text-sm font-semibold text-slate-200"
                >
                    Reset
                </button>
                <button
                    type="button"
                    onClick={closeSheet}
                    className="flex-1 h-12 rounded-[10px] bg-[#22d3ee] text-[#06141a] text-sm font-bold"
                >
                    Show {displayedSongs.length} songs
                </button>
            </div>
        </div>
    );

    const sheetContent = sheet ?? lastSheet;

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden">
            <MobileLibrary
                filter={filter}
                isLoading={isLoadingSongs}
                error={errorSongs}
                selectedSong={selectedSong}
                onOpenSong={openSong}
                sortConfig={sortConfig}
                onSortConfigChange={onSortConfigChange}
                onOpenMenu={() => openSheet('menu')}
                onOpenRange={() => openSheet('range')}
                bulkPanel={bulkPanel}
            />

            {!bulkPanel && (
                <MobileSongView
                    open={songOpen && selectedSong !== null}
                    onBack={goBack}
                    song={selectedSong}
                    audio={audio}
                    {...songViewProps}
                />
            )}

            {toast && (
                <div
                    key={toast.id}
                    role="status"
                    className="motion-toast-mobile fixed left-4 right-4 bottom-[calc(104px+env(safe-area-inset-bottom))] z-30 flex items-center gap-2.5 pl-3 pr-3.5 py-[11px] rounded-xl bg-[rgba(12,15,22,.96)] border border-[rgba(34,211,238,.3)] shadow-[0_20px_50px_rgba(0,0,0,.5)] text-[13px] text-slate-200"
                >
                    <span className="w-5 h-5 flex-none rounded-full bg-[#22d3ee] flex items-center justify-center">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#06141a"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </span>
                    <span className="min-w-0 truncate">{toast.text}</span>
                </div>
            )}

            <BottomSheet open={sheet !== null} onClose={closeSheet} labelledBy="mobile-sheet-title">
                {sheetContent === 'menu' ? renderMenu() : renderRange()}
            </BottomSheet>
        </div>
    );
};
