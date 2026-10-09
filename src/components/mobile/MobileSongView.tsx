import React, { useEffect, useRef, useState } from 'react';
import { Song, FileInfo } from '../../types';
import { Spinner } from '../Spinner';
import { FileTable } from '../FileTable';
import { AudioPlayerControl } from '../AudioPlayerControl';
import { ArrowDownTrayIcon, ChevronDownIcon } from '../Icons';
import { ExportState } from '../SongWorkspace';
import { useSettings } from '../../contexts/SettingsContext';
import { getExtraChart, getExtraCharts } from '../../extraCharts';
import { DIFFICULTY_ORDER, getDifficultyColor, floorLevel } from '../../utils/difficulty';
import { getResourceUrl, hasPerDifficultyIllustrations } from '../../utils/resourceUrls';

interface MobileSongViewProps {
    open: boolean;
    onBack: () => void;
    song: Song | null;
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
}

// How far (px) the page has to scroll before the illustration is fully dimmed.
const DIM_DISTANCE = 320;
const MAX_DIM = 0.82;
// The compact title bar fades in over this scroll range.
const BAR_FADE_START = 120;
const BAR_FADE_LENGTH = 60;

const ProgressBar: React.FC<{ progress: number; className: string }> = ({ progress, className }) => (
    <div className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-150 ${className}`} style={{ width: `${progress.toFixed(0)}%` }} />
);

const DifficultyTiles: React.FC<{
    song: Song;
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
}> = ({ song, difficulties, selectedDifficulty, onSelectDifficulty }) => {
    const { settings } = useSettings();
    // Always show the four standard slots (a missing chart is disabled), plus any extra charts such as SP.
    const slots = [...DIFFICULTY_ORDER, ...getExtraCharts(song.id).map(e => e.difficulty)];

    return (
        <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">AVAILABLE DIFFICULTIES</span>
            <div className={`grid ${slots.length > 4 ? 'grid-cols-5' : 'grid-cols-4'} gap-2`} role="radiogroup" aria-label="Difficulty">
                {slots.map(diff => {
                    const available = difficulties.includes(diff);
                    const selected = available && diff === selectedDifficulty;
                    const key = diff as keyof Song['charters'];
                    const extra = getExtraChart(song.id, diff);
                    const level = song.difficulties?.[key] ?? extra?.level;
                    const charter = song.charters[key];
                    const tooltip = [extra?.tooltip, settings.advancedInfo && charter ? `Charter: ${charter}` : null].filter(Boolean).join('\n');
                    return (
                        <button
                            key={diff}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            onClick={() => onSelectDifficulty(diff)}
                            title={tooltip || undefined}
                            className="h-[68px] px-3 py-2.5 rounded-[10px] border backdrop-blur-[4px] flex flex-col items-start justify-between disabled:opacity-35 disabled:cursor-not-allowed"
                            style={{
                                borderColor: selected ? '#ffffff' : 'rgba(255,255,255,0.08)',
                                background: selected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.015)',
                            }}
                        >
                            <span className="font-bold text-[13px] tracking-[.08em]" style={{ color: getDifficultyColor(diff) }}>{diff}</span>
                            <span className={`text-[22px] font-semibold leading-none ${selected ? 'text-white' : 'text-slate-500'}`}>
                                {available ? floorLevel(level ?? '?') : 'N/A'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const MobileSongView: React.FC<MobileSongViewProps> = ({
    open,
    onBack,
    song,
    bgImage,
    isBgLoaded,
    audio,
    files,
    isLoadingFiles,
    difficulties,
    selectedDifficulty,
    onSelectDifficulty,
    exportState,
    onExportChart,
    onExportAllAssets,
    onDownloaded,
}) => {
    const { settings } = useSettings();
    const [filesOpen, setFilesOpen] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const filesToggleRef = useRef<HTMLButtonElement>(null);

    // Each time a song page is pushed it starts from the top with the file list collapsed.
    useEffect(() => {
        if (!open) return;
        scrollRef.current?.scrollTo({ top: 0 });
        setScrollTop(0);
        setFilesOpen(false);
    }, [open, song?.id]);

    const toggleFiles = () => {
        const open = !filesOpen;
        setFilesOpen(open);
        if (open) {
            requestAnimationFrame(() => {
                const toggle = filesToggleRef.current;
                if (toggle) scrollRef.current?.scrollTo({ top: toggle.offsetTop - 72, behavior: 'smooth' });
            });
        }
    };

    const isExporting = exportState.type !== null;
    const dim = Math.min(scrollTop / DIM_DISTANCE, 1) * MAX_DIM;
    const barOpacity = Math.max(0, Math.min(1, (scrollTop - BAR_FADE_START) / BAR_FADE_LENGTH));

    // Data-light hero: the 512px low-res art shows first, the full illustration fades in over it once loaded.
    const lowResUrl = song && !hasPerDifficultyIllustrations(song.id)
        ? getResourceUrl(settings.proxySource, 'illustrationLowRes', `${song.id}.png`)
        : null;

    return (
        <div
            aria-hidden={!open}
            className={`absolute inset-0 z-10 bg-[#090b10] shadow-[-20px_0_60px_rgba(0,0,0,.5)] transition-[transform,visibility] duration-[340ms] ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'translate-x-0 visible' : 'translate-x-[105%] invisible'}`}
        >
            {/* Hero illustration */}
            <div className="absolute inset-x-0 top-0 h-[296px] overflow-hidden bg-[repeating-linear-gradient(135deg,#141b29_0_10px,#0f1521_10px_20px)]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: lowResUrl ? `url("${lowResUrl}")` : 'none' }}
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[600ms] ease-out"
                    style={{ backgroundImage: bgImage ? `url("${bgImage}")` : 'none', opacity: isBgLoaded ? 1 : 0 }}
                    aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,11,16,.35)_0%,rgba(9,11,16,0)_22%,rgba(9,11,16,.7)_62%,#090b10_92%)]" />
            </div>
            <div className="absolute inset-0 pointer-events-none bg-[#090b10]" style={{ opacity: dim }} />

            <div
                ref={scrollRef}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                className="absolute inset-0 overflow-y-auto px-5 pt-[176px] pb-[130px]"
            >
                {song && (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-mono text-[11px] font-medium tracking-[.12em] text-[#22d3ee] break-all select-all" title="Song ID">{song.id}</span>
                            <h2 className="text-[32px] font-bold leading-[1.12] tracking-[-0.01em] text-white break-words text-balance">{song.name}</h2>
                            <span className="text-[15px] text-slate-400">{song.composer}</span>
                        </div>

                        {settings.newUiAudioPreview && audio && <AudioPlayerControl audio={audio} variant="mobile" />}

                        {isLoadingFiles ? (
                            <div className="flex flex-col gap-2.5">
                                <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">LOADING DIFFICULTIES...</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="h-[68px] rounded-[10px] border border-white/[.06] bg-white/[.015] animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ) : difficulties.length > 0 ? (
                            <DifficultyTiles
                                song={song}
                                difficulties={difficulties}
                                selectedDifficulty={selectedDifficulty}
                                onSelectDifficulty={onSelectDifficulty}
                            />
                        ) : (
                            <p className="text-sm text-slate-500">No charts were found for this song.</p>
                        )}

                        <div className="flex flex-col">
                            <button
                                ref={filesToggleRef}
                                type="button"
                                onClick={toggleFiles}
                                aria-expanded={filesOpen}
                                className="h-[52px] flex items-center justify-between border-t border-white/[.06]"
                            >
                                <span className="flex items-center gap-2 text-sm text-slate-300">
                                    <ChevronDownIcon className={`w-3.5 h-3.5 [stroke-width:2] transition-transform duration-200 ${filesOpen ? '' : '-rotate-90'}`} />
                                    Individual files
                                    <span className="font-mono text-[11px] font-medium text-slate-500">· {isLoadingFiles ? '…' : files.length}</span>
                                </span>
                                <span className="font-mono text-[10px] font-medium tracking-[.12em] text-slate-600">{filesOpen ? 'HIDE' : 'SHOW'}</span>
                            </button>
                            {filesOpen && (
                                <div className="pt-1.5">
                                    <FileTable selectedSong={song} files={files} isLoading={isLoadingFiles} onDownloaded={onDownloaded} variant="mobile" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Compact title bar, fades in once the big title scrolls away */}
            <div
                className="absolute inset-x-0 top-0 h-14 px-16 flex items-center justify-center bg-[rgba(16,20,29,.92)] backdrop-blur-[14px] border-b border-white/[.08] pointer-events-none"
                style={{ opacity: barOpacity }}
                aria-hidden="true"
            >
                <span className="text-[15px] font-semibold text-slate-100 truncate">{song?.name}</span>
            </div>
            <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="absolute top-1.5 left-3 w-11 h-11 rounded-full border border-white/[.1] bg-[rgba(9,11,16,.55)] backdrop-blur-[10px] text-slate-100 flex items-center justify-center"
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>

            {/* Thumb-reach export bar */}
            <div className="absolute inset-x-0 bottom-0 flex gap-2.5 px-4 pt-6 pb-[calc(16px+env(safe-area-inset-bottom))] bg-[linear-gradient(to_top,#090b10_62%,rgba(9,11,16,0))]">
                <button
                    type="button"
                    onClick={onExportChart}
                    disabled={isExporting || !selectedDifficulty}
                    className="relative overflow-hidden flex-1 min-w-0 h-[54px] rounded-xl bg-[#22d3ee] text-[#06141a] flex items-center justify-center gap-[9px] font-bold text-[15px] tracking-[.03em] whitespace-nowrap disabled:cursor-not-allowed disabled:bg-[#22d3ee]/40"
                >
                    {exportState.type === 'chart' ? (
                        <>
                            <span className="[&_svg]:text-[#06141a] [&_svg]:w-[18px] [&_svg]:h-[18px]"><Spinner /></span>
                            Exporting…
                        </>
                    ) : (
                        <>
                            <ArrowDownTrayIcon className="w-[18px] h-[18px] flex-none [stroke-width:2]" />
                            <span className="truncate">Export [{selectedDifficulty ?? ''}] for Phira &amp; RPE</span>
                        </>
                    )}
                    {exportState.type === 'chart' && <ProgressBar progress={exportState.progress} className="bg-[#06141a]/40" />}
                </button>
                <button
                    type="button"
                    onClick={onExportAllAssets}
                    disabled={isExporting || files.length === 0}
                    aria-label="Export all assets as .zip"
                    className="relative overflow-hidden flex-none w-[72px] h-[54px] rounded-xl border border-white/[.14] bg-[rgba(9,11,16,.5)] backdrop-blur-[8px] text-slate-200 flex flex-col items-center justify-center gap-px disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exportState.type === 'phira'
                        ? <span className="[&_svg]:w-[18px] [&_svg]:h-[18px]"><Spinner /></span>
                        : <span className="font-mono text-[13px] font-semibold tracking-[.06em]">.zip</span>}
                    <span className="text-[10px] leading-none text-slate-400">All assets</span>
                    {exportState.type === 'phira' && <ProgressBar progress={exportState.progress} className="bg-[#22d3ee]/75" />}
                </button>
            </div>
        </div>
    );
};
