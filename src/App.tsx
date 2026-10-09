import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SongSelector } from './components/SongSelector';
import { SongWorkspace, ExportState } from './components/SongWorkspace';
import { Spinner } from './components/Spinner';
import { BlacklistWarningPopup } from './components/BlacklistWarningPopup';
import { isBlacklisted, BlacklistEntry } from './blacklist';
import { PatchedChartPopup } from './components/PatchedChartPopup';
import { getPatchedChart, PatchedChartEntry } from './patchedCharts';
import FileSaver from 'file-saver';
import { SettingsPopup, SettingsCategory } from './components/SettingsPopup';
import { FAQPopup } from './components/FAQPopup';
import { AboutPopup } from './components/AboutPopup';
import { InstructionPopup } from './components/InstructionPopup';
import { ResourceErrorPopup } from './components/ResourceErrorPopup';
import { Button } from './components/ui/Dialog';
import { useSettings } from './contexts/SettingsContext';
import { resourceFetch } from './utils/githubAuth';
import { useResourceError } from './contexts/ResourceErrorContext';
import { Song, SortConfig } from './types';
import { fetchVersion, fetchSongs, sendPatchedChartDownloadNotification } from './utils/api';
import { registerSongAliasesConsoleHelper } from './utils/songAliasesExport';
import { exportAllAssets, exportChart, exportBulkAssets } from './utils/export';
import { getResourceUrl, hasPerDifficultyIllustrations, getDifficultyIllustrationUrl } from './utils/resourceUrls';
import { useSongFiles, getChartDifficulty } from './hooks/useSongFiles';
import { useIsMobile } from './hooks/useIsMobile';
import { MobileLayout } from './components/mobile/MobileLayout';

const REPO_URL = 'https://github.com/swordalt/phigros-chart-downloader/';
const INSTRUCTION_SHOWN_KEY = 'phigrosDownloader_instructionShown';

const App: React.FC = () => {
    const { settings } = useSettings();
    const { reportResourceError } = useResourceError();
    const isMobile = useIsMobile();

    useEffect(() => {
        document.documentElement.dataset.blur = settings.newUiBlur ? 'on' : 'off';
    }, [settings.newUiBlur]);
    const [version, setVersion] = useState<string | null>(null);
    const [isLoadingVersion, setIsLoadingVersion] = useState<boolean>(true);
    const [errorVersion, setErrorVersion] = useState<string | null>(null);

    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoadingSongs, setIsLoadingSongs] = useState<boolean>(true);
    const [errorSongs, setErrorSongs] = useState<string | null>(null);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ type: 'alphanumerical', direction: 'asc' });

    // The difficulty the user last picked; carried over to the next song when it has that chart.
    const [preferredDifficulty, setPreferredDifficulty] = useState<string>('IN');
    const [exportState, setExportState] = useState<ExportState>({ type: null, progress: 0 });
    const [bulkExportState, setBulkExportState] = useState<{
        isExporting: boolean;
        currentFile: string;
        action: 'Downloading' | 'Zipping' | 'Waiting' | null;
        songsLeft: number;
        percent: number;
    }>({ isExporting: false, currentFile: '', action: null, songsLeft: 0, percent: 0 });
    const [bulkDelay, setBulkDelay] = useState<string>('0');
    const [bulkLimit, setBulkLimit] = useState<string>('');
    const [blacklistWarning, setBlacklistWarning] = useState<(BlacklistEntry & { exportType: 'phira' | 'chart' }) | null>(null);
    const [patchedChartPrompt, setPatchedChartPrompt] = useState<PatchedChartEntry | null>(null);
    const [showInstruction, setShowInstruction] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFaqOpen, setIsFaqOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>('export');
    const openSettings = (category: SettingsCategory) => {
        setSettingsCategory(category);
        setIsSettingsOpen(true);
    };

    const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
    const toastTimeoutRef = useRef<number | null>(null);
    const showToast = useCallback((text: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ id: Date.now(), text });
        toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2600);
    }, []);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Background and Audio management
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [isBgLoaded, setIsBgLoaded] = useState<boolean>(false);
    const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

    const initialSongSelected = useRef<boolean>(false);

    const { files, isLoading: isLoadingFiles } = useSongFiles(selectedSong, settings.proxySource);
    const availableDifficulties = React.useMemo(
        () => files.map(getChartDifficulty).filter((diff): diff is string => diff !== null),
        [files]
    );
    const selectedDifficulty = availableDifficulties.length === 0
        ? null
        : availableDifficulties.includes(preferredDifficulty)
            ? preferredDifficulty
            : availableDifficulties[availableDifficulties.length - 1];

    const sortedSongs = React.useMemo(() => {
        const result = [...songs];

        if (sortConfig.type === 'alphanumerical') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }
        // If 'unsorted', we rely on the original order (which is essentially what songs is)

        if (sortConfig.direction === 'desc') {
            result.reverse();
        }

        return result;
    }, [songs, sortConfig]);

    const loadVersion = useCallback(async () => {
        setIsLoadingVersion(true);
        setErrorVersion(null);
        try {
            const ver = await fetchVersion(settings.proxySource);
            setVersion(ver);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setErrorVersion(message);
            console.error(err);
            reportResourceError('Failed to load the version info.', () => loadVersion(), message);
        } finally {
            setIsLoadingVersion(false);
        }
    }, [settings.proxySource, reportResourceError]);

    const loadSongs = useCallback(async () => {
        setIsLoadingSongs(true);
        setErrorSongs(null);
        try {
            const fetchedSongs = await fetchSongs(settings.proxySource);
            setSongs(fetchedSongs);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An error occurred while fetching songs.';
            setErrorSongs(message);
            console.error(err);
            reportResourceError('Failed to load the song list.', () => loadSongs(), message);
        } finally {
            setIsLoadingSongs(false);
        }
    }, [settings.proxySource, reportResourceError]);

    useEffect(() => {
        registerSongAliasesConsoleHelper(songs);
    }, [songs]);

    useEffect(() => {
        loadVersion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.proxySource]);

    useEffect(() => {
        loadSongs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.proxySource]);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    const handleSongSelect = useCallback((song: Song | null) => {
        setSelectedSong(song);
    }, []);

    useEffect(() => {
        if (songs.length > 0 && !initialSongSelected.current) {
            initialSongSelected.current = true;
            const urlParams = new URLSearchParams(window.location.search);
            const songIdFromUrl = urlParams.get('song');

            if (songIdFromUrl) {
                const songToSelect = songs.find(s => s.id === songIdFromUrl);
                if (songToSelect) {
                    handleSongSelect(songToSelect);
                }
            }
        }
    }, [songs, handleSongSelect]);

    // Illustration behind the workspace. Songs with per-difficulty art follow the selected difficulty.
    const illustrationUrl = selectedSong
        ? hasPerDifficultyIllustrations(selectedSong.id)
            ? getDifficultyIllustrationUrl(settings.proxySource, selectedSong.id, selectedDifficulty && ['EZ', 'HD', 'IN', 'AT'].includes(selectedDifficulty) ? selectedDifficulty : 'AT')
            : getResourceUrl(settings.proxySource, 'illustration', `${selectedSong.id}.png`)
        : null;

    useEffect(() => {
        setIsBgLoaded(false);
        if (!illustrationUrl) {
            setBgImage(null);
            return;
        }

        let cancelled = false;
        const img = new Image();
        img.src = illustrationUrl;
        img.onload = () => {
            if (cancelled) return;
            setBgImage(illustrationUrl);
            setIsBgLoaded(true);
        };
        img.onerror = () => {
            if (cancelled) return;
            setBgImage(null);
            setIsBgLoaded(false);
        };
        return () => {
            cancelled = true;
        };
    }, [illustrationUrl]);

    // Audio preview
    useEffect(() => {
        if (!selectedSong || settings.bulkDownloadMode || !settings.newUiAudioPreview) {
            setActiveAudio(prev => {
                if (prev) prev.pause();
                return null;
            });
            return;
        }

        const audioUrl = getResourceUrl(settings.proxySource, 'music', `${selectedSong.id}.ogg`);
        const audio = new Audio();
        // IMPORTANT: Must set crossOrigin to anonymous BEFORE loading to allow Web Audio API analysis
        audio.crossOrigin = "anonymous";
        audio.src = audioUrl;
        audio.loop = settings.newUiLoopAudio;
        audio.volume = settings.newUiAudioVolume;

        setActiveAudio(prev => {
            if (prev) prev.pause();
            return audio;
        });

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Autoplay blocked or audio failed to load:", error);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSong, settings.newUiAudioPreview, settings.bulkDownloadMode, settings.proxySource]);

    // Update audio loop property immediately when setting changes
    useEffect(() => {
        if (activeAudio) {
            activeAudio.loop = settings.newUiLoopAudio;
        }
    }, [activeAudio, settings.newUiLoopAudio]);

    // Update audio volume when setting changes
    useEffect(() => {
        if (activeAudio) {
            activeAudio.volume = settings.newUiAudioVolume;
        }
    }, [activeAudio, settings.newUiAudioVolume]);

    // Stop audio when the audio element is replaced or the app unmounts
    useEffect(() => {
        return () => {
            if (activeAudio) activeAudio.pause();
        };
    }, [activeAudio]);

    const executeAllAssetsExport = async () => {
        if (!selectedSong || files.length === 0 || exportState.type) return;

        setExportState({ type: 'phira', progress: 0 });
        try {
            const fileName = await exportAllAssets(files, selectedSong, settings, (progress) => {
                setExportState(prev => ({ ...prev, progress }));
            });
            showToast(`Exported all assets · ${fileName}`);
        } catch (error) {
            console.error("Failed to export all assets: ", error);
            reportResourceError(
                'Failed to export all assets.',
                () => executeAllAssetsExport(),
                error instanceof Error ? error.message : undefined
            );
        } finally {
            setExportState({ type: null, progress: 0 });
        }
    };

    const executeChartExport = async () => {
        if (!selectedSong || !selectedDifficulty || exportState.type) return;

        setExportState({ type: 'chart', progress: 0 });
        try {
            const fileName = await exportChart(files, selectedSong, selectedDifficulty, settings, (progress) => {
                setExportState(prev => ({ ...prev, progress }));
            });
            showToast(`Exported ${fileName}`);
        } catch (error) {
            console.error("Failed to export as chart: ", error);
            reportResourceError(
                'Failed to export the chart.',
                () => executeChartExport(),
                error instanceof Error ? error.message : undefined
            );
        } finally {
            setExportState({ type: null, progress: 0 });
        }
    };

    const handleExportAllAssets = () => {
        if (!selectedSong || exportState.type) return;
        executeAllAssetsExport();
    };

    // Patched chart → known-issue warning → export.
    const proceedChartExport = () => {
        if (!selectedSong || !selectedDifficulty) return;

        const patched = getPatchedChart(selectedSong.id, selectedDifficulty);
        if (patched) {
            setPatchedChartPrompt(patched);
            return;
        }

        startChartExport();
    };

    const handleExportChart = () => {
        if (!selectedSong || !selectedDifficulty || exportState.type) return;

        // The "Before you play" notice is shown once, before the first export.
        if (!localStorage.getItem(INSTRUCTION_SHOWN_KEY)) {
            setShowInstruction(true);
            return;
        }

        proceedChartExport();
    };

    const handleInstructionConfirm = () => {
        localStorage.setItem(INSTRUCTION_SHOWN_KEY, 'true');
        setShowInstruction(false);
        proceedChartExport();
    };

    const startChartExport = () => {
        if (!selectedSong || !selectedDifficulty) return;
        const entry = isBlacklisted(selectedSong.id, selectedDifficulty);
        if (entry) {
            setBlacklistWarning({ ...entry, exportType: 'chart' });
        } else {
            executeChartExport();
        }
    };

    const handlePatchedOriginal = () => {
        setPatchedChartPrompt(null);
        startChartExport();
    };

    const handlePatchedDownload = async () => {
        const patched = patchedChartPrompt;
        setPatchedChartPrompt(null);
        if (!patched || !selectedSong || exportState.type) return;

        setExportState({ type: 'chart', progress: 0 });
        try {
            const response = await resourceFetch(patched.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            FileSaver.saveAs(blob, patched.fileName);
            sendPatchedChartDownloadNotification(selectedSong.name, patched.difficulty);
            showToast(`Exported ${patched.fileName}`);
        } catch (error) {
            console.error("Failed to download patched chart: ", error);
            reportResourceError(
                'Failed to download the patched chart.',
                () => handlePatchedDownload(),
                error instanceof Error ? error.message : undefined
            );
        } finally {
            setExportState({ type: null, progress: 0 });
        }
    };

    const handleBulkExport = async () => {
        if (bulkExportState.isExporting || songs.length === 0) return;

        const parsedLimit = parseInt(bulkLimit, 10);
        const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, songs.length) : songs.length;
        const songsToExport = songs.slice(0, limit);

        setBulkExportState({
            isExporting: true,
            currentFile: 'Starting...',
            action: 'Downloading',
            songsLeft: songsToExport.length,
            percent: 0
        });

        abortControllerRef.current = new AbortController();

        try {
            const delaySeconds = parseFloat(bulkDelay) || 0;
            await exportBulkAssets(songsToExport, delaySeconds, settings.proxySource, (currentFile, action, songsLeft, percent) => {
                setBulkExportState(prev => ({
                    ...prev,
                    currentFile,
                    action,
                    songsLeft,
                    percent: percent || 0
                }));
            }, abortControllerRef.current.signal);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Ignore abort errors
            } else {
                console.error("Bulk export failed: ", error);
                reportResourceError(
                    'Failed during bulk export.',
                    () => handleBulkExport(),
                    error instanceof Error ? error.message : undefined
                );
            }
        } finally {
            setBulkExportState({
                isExporting: false,
                currentFile: '',
                action: null,
                songsLeft: 0,
                percent: 0
            });
            abortControllerRef.current = null;
        }
    };

    const cancelBulkExport = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // Cancel bulk export when exiting bulk download mode
    useEffect(() => {
        if (!settings.bulkDownloadMode) {
            cancelBulkExport();
        }
    }, [settings.bulkDownloadMode, cancelBulkExport]);

    const handleBlacklistConfirm = () => {
        if (!blacklistWarning) return;

        if (blacklistWarning.exportType === 'chart') {
            executeChartExport();
        }
        setBlacklistWarning(null);
    };

    const handleBlacklistCancel = () => {
        setBlacklistWarning(null);
    };

    const handleFileDownloaded = useCallback((fileName: string) => showToast(`Saved ${fileName}`), [showToast]);

    const bulkInputClass = 'w-full h-10 rounded-[10px] bg-white/[.04] border border-white/[.08] px-3 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[rgba(34,211,238,.45)] disabled:opacity-50';

    const renderBulkPanel = () => (
        <div className="h-full overflow-y-auto thin-scroll flex items-center justify-center p-5 sm:p-10">
            <div className="w-full max-w-lg flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 font-mono text-[11px] font-medium tracking-[.12em] text-[#fbbf24]">
                        BULK DOWNLOAD MODE
                        <span className="text-[9px] font-semibold tracking-[.1em] px-1.5 py-0.5 rounded bg-[rgba(251,191,36,.1)]">WIP</span>
                    </span>
                    <h2 className="text-[32px] font-bold leading-[1.15] text-white">Export every song</h2>
                    <p className="text-sm text-slate-400">To return to the normal page, turn off “Bulk download mode” in Settings → Advanced.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">DELAY (SECONDS)</span>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={bulkDelay}
                            onChange={(e) => setBulkDelay(e.target.value)}
                            disabled={bulkExportState.isExporting}
                            className={bulkInputClass}
                            placeholder="0"
                        />
                        <span className="text-xs text-slate-500">Pause between songs to avoid rate limits. GitHub allows roughly 5000 requests/hour.</span>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500">SONGS (MAX {songs.length})</span>
                        <input
                            type="number"
                            min="1"
                            max={songs.length}
                            value={bulkLimit}
                            onChange={(e) => setBulkLimit(e.target.value)}
                            disabled={bulkExportState.isExporting || songs.length === 0}
                            className={bulkInputClass}
                            placeholder={songs.length.toString()}
                        />
                        <span className="text-xs text-slate-500">Limit the number of songs to download for testing.</span>
                    </label>
                </div>

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={handleBulkExport}
                        disabled={bulkExportState.isExporting || songs.length === 0}
                        className="relative overflow-hidden flex-1 h-[52px] rounded-[10px] bg-[#22d3ee] hover:bg-[#67e8f9] text-[#06141a] flex items-center justify-center gap-2.5 font-bold text-[15px] tracking-[.04em] transition-colors disabled:cursor-not-allowed disabled:bg-[#22d3ee]/40"
                    >
                        {bulkExportState.isExporting ? (
                            <>
                                <span className="[&_svg]:text-[#06141a]"><Spinner /></span>
                                Processing…
                            </>
                        ) : (
                            'Export all assets for every song'
                        )}
                        {bulkExportState.isExporting && bulkExportState.action === 'Zipping' && (
                            <div
                                className="absolute bottom-0 left-0 h-[3px] bg-[#06141a]/40 transition-[width] duration-150"
                                style={{ width: `${bulkExportState.percent.toFixed(0)}%` }}
                            />
                        )}
                    </button>
                    {bulkExportState.isExporting && (
                        <Button variant="danger" className="h-[52px] px-5 rounded-[10px]" onClick={cancelBulkExport}>Cancel</Button>
                    )}
                </div>

                {bulkExportState.isExporting && (
                    <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/[.07] bg-white/[.02]">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Action: <span className="text-[#22d3ee]">{bulkExportState.action}</span></span>
                            <span className="font-mono text-xs text-slate-400">{bulkExportState.songsLeft} LEFT</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 truncate" title={bulkExportState.currentFile}>
                            {bulkExportState.currentFile}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative h-dvh flex flex-col antialiased font-saira text-slate-200 bg-[#090b10] overflow-hidden">
            {isSettingsOpen && <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} initialCategory={settingsCategory} />}
            {isFaqOpen && <FAQPopup isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />}
            {isAboutOpen && <AboutPopup isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />}
            <ResourceErrorPopup onSwitchProxy={() => openSettings('proxy')} />
            <InstructionPopup
                isOpen={showInstruction}
                onConfirm={handleInstructionConfirm}
                onCancel={() => setShowInstruction(false)}
            />
            {patchedChartPrompt && (
                <PatchedChartPopup
                    isOpen={!!patchedChartPrompt}
                    onCancel={() => setPatchedChartPrompt(null)}
                    onDownloadOriginal={handlePatchedOriginal}
                    onDownloadPatched={handlePatchedDownload}
                    reason={patchedChartPrompt.reason}
                    songName={selectedSong?.name}
                    difficulty={patchedChartPrompt.difficulty}
                />
            )}
            {blacklistWarning && (
                <BlacklistWarningPopup
                    isOpen={!!blacklistWarning}
                    onCancel={handleBlacklistCancel}
                    onConfirm={handleBlacklistConfirm}
                    reason={blacklistWarning.reason}
                />
            )}

            {isMobile ? (
                <MobileLayout
                    songs={sortedSongs}
                    isLoadingSongs={isLoadingSongs}
                    errorSongs={errorSongs}
                    selectedSong={selectedSong}
                    onSongSelect={handleSongSelect}
                    sortConfig={sortConfig}
                    onSortConfigChange={setSortConfig}
                    version={version}
                    isLoadingVersion={isLoadingVersion}
                    versionError={errorVersion}
                    onRetryVersion={loadVersion}
                    onAboutClick={() => setIsAboutOpen(true)}
                    onFaqClick={() => setIsFaqOpen(true)}
                    onSettingsClick={() => openSettings('export')}
                    bgImage={bgImage}
                    isBgLoaded={isBgLoaded}
                    audio={activeAudio}
                    files={files}
                    isLoadingFiles={isLoadingFiles}
                    difficulties={availableDifficulties}
                    selectedDifficulty={selectedDifficulty}
                    onSelectDifficulty={setPreferredDifficulty}
                    exportState={exportState}
                    onExportChart={handleExportChart}
                    onExportAllAssets={handleExportAllAssets}
                    onDownloaded={handleFileDownloaded}
                    bulkPanel={settings.bulkDownloadMode ? renderBulkPanel() : null}
                    toast={toast}
                />
            ) : (
            <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                <Header
                    version={version}
                    isLoadingVersion={isLoadingVersion}
                    versionError={errorVersion}
                    onRetryVersion={loadVersion}
                    onSettingsClick={() => openSettings('export')}
                    onFaqClick={() => setIsFaqOpen(true)}
                    onAboutClick={() => setIsAboutOpen(true)}
                />

                <main className="flex-1 min-h-0 grid grid-rows-[minmax(0,40%)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[340px_minmax(0,1fr)]">
                    <aside className="min-h-0 border-b md:border-b-0 md:border-r border-white/[.06]">
                        <SongSelector
                            isLoading={isLoadingSongs}
                            error={errorSongs}
                            songs={sortedSongs}
                            selectedSong={selectedSong}
                            onSongSelect={handleSongSelect}
                            sortConfig={sortConfig}
                            onSortConfigChange={setSortConfig}
                        />
                    </aside>

                    <section className="relative min-h-0">
                        {settings.bulkDownloadMode ? renderBulkPanel() : (
                            <SongWorkspace
                                song={selectedSong}
                                bgImage={bgImage}
                                isBgLoaded={isBgLoaded}
                                audio={activeAudio}
                                files={files}
                                isLoadingFiles={isLoadingFiles}
                                difficulties={availableDifficulties}
                                selectedDifficulty={selectedDifficulty}
                                onSelectDifficulty={setPreferredDifficulty}
                                exportState={exportState}
                                onExportChart={handleExportChart}
                                onExportAllAssets={handleExportAllAssets}
                                onDownloaded={handleFileDownloaded}
                            />
                        )}

                        {toast && (
                            <div
                                key={toast.id}
                                role="status"
                                className="motion-toast absolute left-1/2 bottom-5 z-30 flex items-center gap-2.5 max-w-[calc(100%-32px)] pl-3 pr-4 py-2.5 rounded-[10px] bg-[rgba(12,15,22,.95)] border border-[rgba(34,211,238,.3)] shadow-[0_20px_50px_rgba(0,0,0,.5)] text-[13px] text-slate-200"
                            >
                                <span className="w-5 h-5 flex-none rounded-full bg-[#22d3ee] flex items-center justify-center">
                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#06141a"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </span>
                                <span className="truncate">{toast.text}</span>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="flex-none min-h-10 flex flex-wrap items-center justify-center text-center gap-x-6 gap-y-0.5 px-4 sm:px-6 py-2 border-t border-white/[.1] bg-[#10141d] text-xs text-slate-500">
                    <span>Source code can be found on <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">GitHub</a>, considering starring the repo.</span>
                    <span className="hidden sm:inline">All assets belong to their respective copyright holders.</span>
                </footer>
            </div>
            )}
        </div>
    );
};

export default App;
