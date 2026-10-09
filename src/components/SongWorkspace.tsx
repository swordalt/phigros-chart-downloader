import React, { useEffect, useRef, useState } from 'react';
import { Song, FileInfo } from '../types';
import { Spinner } from './Spinner';
import { DifficultySelector } from './DifficultySelector';
import { FileTable } from './FileTable';
import { AudioPlayerControl } from './AudioPlayerControl';
import { ArrowDownTrayIcon, ChevronDownIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

export interface ExportState {
    type: 'phira' | 'chart' | null;
    progress: number;
}

interface SongWorkspaceProps {
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

// How far (px) the file list has to scroll before the illustration is fully dimmed.
const DIM_DISTANCE = 320;
const MAX_DIM = 0.82;

const ProgressBar: React.FC<{ progress: number; className: string }> = ({ progress, className }) => (
    <div className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-150 ${className}`} style={{ width: `${progress.toFixed(0)}%` }} />
);

export const SongWorkspace: React.FC<SongWorkspaceProps> = ({
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

    // Jump back to the workspace when switching songs.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [song?.id]);

    const toggleFiles = () => {
        const open = !filesOpen;
        setFilesOpen(open);
        if (open) {
            requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 300, behavior: 'smooth' }));
        }
    };

    const isExporting = exportState.type !== null;
    const dim = Math.min(scrollTop / DIM_DISTANCE, 1) * MAX_DIM;

    return (
        <div className="relative h-full min-h-0 overflow-hidden">
            {/* Illustration layer */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#141b29_0_10px,#0f1521_10px_20px)]" />
            <div
                className="absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-700 ease-out"
                style={{
                    backgroundImage: bgImage ? `url("${bgImage}")` : 'none',
                    opacity: isBgLoaded ? 1 : 0,
                    transform: isBgLoaded ? 'scale(1)' : 'scale(1.04)',
                }}
                aria-hidden="true"
            />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(9,11,16,0)_15%,rgba(9,11,16,.7)_50%,#090b10_82%)]" />
            <div className="absolute inset-0 pointer-events-none bg-[#090b10]" style={{ opacity: dim }} />

            <div
                ref={scrollRef}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                className="absolute inset-0 overflow-y-auto thin-scroll"
            >
                {!song ? (
                    <div className="min-h-full flex flex-col justify-end gap-2 px-5 sm:px-10 pb-12">
                        <span className="font-mono text-[11px] font-medium tracking-[.12em] text-[#22d3ee]">NO SONG SELECTED</span>
                        <span className="text-[32px] sm:text-[52px] font-bold leading-[1.15] tracking-[-0.01em] text-white">Pick a song</span>
                        <span className="text-base text-slate-400">Choose one from the list to see its charts and files.</span>
                    </div>
                ) : (
                    <>
                        <div className="min-h-full flex flex-col justify-end gap-5 px-5 sm:px-10 pt-10">
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="font-mono text-[11px] font-medium tracking-[.12em] text-[#22d3ee] break-all select-all" title="Song ID">{song.id}</span>
                                    <h2 className="text-[32px] sm:text-[52px] font-bold leading-[1.15] tracking-[-0.01em] text-white break-words">{song.name}</h2>
                                    <span className="text-base text-slate-400">{song.composer}</span>
                                </div>
                                {settings.newUiAudioPreview && audio && (
                                    <div className="self-start lg:self-auto">
                                        <AudioPlayerControl audio={audio} />
                                    </div>
                                )}
                            </div>

                            {isLoadingFiles ? (
                                <div className="flex flex-col gap-2.5">
                                    <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">LOADING DIFFICULTIES...</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="h-[56px] rounded-[10px] border border-white/[.06] bg-white/[.015] animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ) : difficulties.length > 0 ? (
                                <DifficultySelector
                                    difficulties={difficulties}
                                    selectedDifficulty={selectedDifficulty}
                                    onSelectDifficulty={onSelectDifficulty}
                                    selectedSong={song}
                                />
                            ) : (
                                <p className="text-sm text-slate-500">No charts were found for this song.</p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button
                                    type="button"
                                    onClick={onExportChart}
                                    disabled={isExporting || !selectedDifficulty}
                                    className="relative overflow-hidden flex-1 h-[52px] rounded-[10px] bg-[#22d3ee] hover:bg-[#67e8f9] text-[#06141a] flex items-center justify-center gap-2.5 font-bold text-[15px] tracking-[.04em] transition-colors disabled:cursor-not-allowed disabled:bg-[#22d3ee]/40 disabled:hover:bg-[#22d3ee]/40"
                                >
                                    {exportState.type === 'chart' ? (
                                        <>
                                            <span className="[&_svg]:text-[#06141a]"><Spinner /></span>
                                            Exporting…
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="w-[18px] h-[18px] [stroke-width:2]" />
                                            Export [{selectedDifficulty ?? ''}] for Phira &amp; RPE
                                        </>
                                    )}
                                    {exportState.type === 'chart' && <ProgressBar progress={exportState.progress} className="bg-[#06141a]/40" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={onExportAllAssets}
                                    disabled={isExporting || files.length === 0}
                                    className="relative overflow-hidden h-[52px] px-5 rounded-[10px] border border-white/[.12] text-slate-200 flex items-center justify-center gap-2.5 font-semibold text-sm backdrop-blur-sm hover:bg-white/[.04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exportState.type === 'phira' ? <><Spinner />Zipping…</> : 'All assets .zip'}
                                    {exportState.type === 'phira' && <ProgressBar progress={exportState.progress} className="bg-[#22d3ee]/75" />}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={toggleFiles}
                                aria-expanded={filesOpen}
                                className="flex items-center justify-between h-12 border-t border-white/[.06] group"
                            >
                                <span className={`flex items-center gap-2 text-[13px] transition-colors ${filesOpen ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    <ChevronDownIcon className={`w-3.5 h-3.5 [stroke-width:2] transition-transform duration-200 ${filesOpen ? '' : '-rotate-90'}`} />
                                    Individual files
                                    <span className="font-mono text-[11px] font-medium text-slate-500">· {isLoadingFiles ? '…' : files.length}</span>
                                </span>
                                <span className="font-mono text-[10px] font-medium tracking-[.12em] text-slate-600">{filesOpen ? 'SCROLL ↓' : 'SHOW'}</span>
                            </button>
                        </div>

                        {filesOpen && (
                            <div className="px-5 sm:px-10 pt-1 pb-10">
                                <FileTable selectedSong={song} files={files} isLoading={isLoadingFiles} onDownloaded={onDownloaded} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
