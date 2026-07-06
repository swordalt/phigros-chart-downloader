
import React, { useState, useEffect, useCallback } from 'react';
import { Spinner } from './Spinner';
import { AssetDownloadWarningPopup } from './AssetDownloadWarningPopup';
import { Song, FileInfo } from '../types';
import { checkUrlExists, sendAssetDownloadNotification } from '../utils/api';
import { ArrowDownTrayIcon, AudioIcon, DocumentTextIcon, PhotoIcon, InformationCircleIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

interface FileTableProps {
    selectedSong: Song | null;
    onFilesFound: (files: FileInfo[]) => void;
}

export const FileTable: React.FC<FileTableProps> = ({ selectedSong, onFilesFound }) => {
    const { settings } = useSettings();
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

    // New state for warning popup
    const [showAssetWarning, setShowAssetWarning] = useState(false);
    const [pendingDownload, setPendingDownload] = useState<{ file: FileInfo; name: string } | null>(null);

    const executeDownload = useCallback(async (file: FileInfo, downloadName: string) => {
        if (downloadingUrl || !selectedSong) return; // Prevent multiple concurrent downloads
        setDownloadingUrl(file.url);
        try {
            const response = await fetch(file.url, { referrerPolicy: 'no-referrer' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            if (!settings.disableDiscordNotifications) {
                sendAssetDownloadNotification(selectedSong.name, file.type);
            }
        } catch (error) {
            console.error('Download failed:', error);
            // Optionally, implement user-facing error feedback
        } finally {
            setDownloadingUrl(null);
        }
    }, [downloadingUrl, selectedSong, settings.disableDiscordNotifications]);
    
    const handleDownloadClick = (file: FileInfo) => {
        if (!selectedSong) return;

        const downloadName = file.type.startsWith('Chart') ? `Chart_${selectedSong.id}_${file.name}` : file.name;

        // Check for chart file and show warning if needed
        if (file.type.startsWith('Chart')) {
            const warningShown = localStorage.getItem('phigrosDownloader_assetWarningShown');
            if (!warningShown) {
                setPendingDownload({ file, name: downloadName });
                setShowAssetWarning(true);
                return;
            }
        }

        executeDownload(file, downloadName);
    };

    const handleWarningConfirm = () => {
        localStorage.setItem('phigrosDownloader_assetWarningShown', 'true');
        setShowAssetWarning(false);
        if (pendingDownload) {
            executeDownload(pendingDownload.file, pendingDownload.name);
            setPendingDownload(null);
        }
    };

    const handleWarningCancel = () => {
        setShowAssetWarning(false);
        setPendingDownload(null);
    };

    useEffect(() => {
        if (!selectedSong) {
            setFiles([]);
            onFilesFound([]);
            return;
        }

        const abortController = new AbortController();

        const fetchFiles = async () => {
            setIsLoading(true);
            setFiles([]);
            onFilesFound([]);
            const songId = selectedSong.id;

            const filesToFind: Promise<FileInfo | null>[] = [];

            // Helper to wrap checkUrlExists with abort signal
            const checkUrl = async (url: string) => {
                if (abortController.signal.aborted) return false;
                return await checkUrlExists(url);
            };

            // Add illustration
            filesToFind.push(
                (async () => {
                    const url = `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustration/${songId}.png`;
                    if (await checkUrl(url)) {
                        return { type: 'Illustration', name: `${songId}.png`, url };
                    }
                    return null;
                })()
            );

            // Add low-res illustration
            filesToFind.push(
                (async () => {
                    const url = `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustrationLowRes/${songId}.png`;
                    if (await checkUrl(url)) {
                        return { type: 'Illustration (Low-Res)', name: `${songId}.png`, url };
                    }
                    return null;
                })()
            );

            // Add blurred illustration
            filesToFind.push(
                (async () => {
                    const url = `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustrationBlur/${songId}.png`;
                    if (await checkUrl(url)) {
                        return { type: 'Illustration (Blur)', name: `${songId}.png`, url };
                    }
                    return null;
                })()
            );

            // Add audio
            filesToFind.push(
                (async () => {
                    const url = `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/music/${songId}.ogg`;
                    if (await checkUrl(url)) {
                        return { type: 'Audio', name: `${songId}.ogg`, url };
                    }
                    return null;
                })()
            );

            // Add chart checks
            const difficulties = ['EZ', 'HD', 'IN', 'AT'];

            if (selectedSong.difficulties) {
                difficulties.forEach(diff => {
                    const diffKey = diff as keyof NonNullable<Song['difficulties']>;
                    if (selectedSong.difficulties?.[diffKey]) {
                        const fileName = `${diff}.json`;
                        const url = `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/chart/${songId}.0/${fileName}`;
                        filesToFind.push(Promise.resolve({
                            type: `Chart (${diff})`,
                            name: fileName,
                            url: url,
                        }));
                    }
                });
            } else {
                difficulties.forEach(diff => {
                    filesToFind.push(
                        (async (): Promise<FileInfo | null> => {
                            const fileName = `${diff}.json`;
                            const urlsToTry = [
                                `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/chart/${songId}.0/${fileName}`
                            ];

                            for (const url of urlsToTry) {
                                if (await checkUrl(url)) {
                                    return {
                                        type: `Chart (${diff})`,
                                        name: fileName,
                                        url: url,
                                    };
                                }
                            }
                            return null;
                        })()
                    );
                });
            }

            try {
                const results = await Promise.all(filesToFind);
                if (abortController.signal.aborted) return;

                const foundFiles = results.filter((file): file is FileInfo => file !== null);

                onFilesFound(foundFiles);
                setFiles(foundFiles);
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error('Error fetching files:', error);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchFiles();

        return () => {
            abortController.abort();
        };
    }, [selectedSong, onFilesFound]);

    const renderFileIcon = (type: string) => {
        const className = "w-6 h-6 mr-3 text-slate-400 flex-shrink-0";
        if (type.startsWith('Illustration')) return <PhotoIcon className={className} />;
        if (type === 'Audio') return <AudioIcon className={className} />;
        if (type.startsWith('Chart')) return <DocumentTextIcon className={className} />;
        return null;
    }

    const getResolution = (type: string) => {
        if (type === 'Illustration') return '2048x1080';
        if (type === 'Illustration (Low-Res)') return '512x270';
        if (type === 'Illustration (Blur)') return '256x135';
        return null;
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center gap-3 text-slate-400 h-40 rounded-b-xl">
                    <Spinner />
                    <span>Checking for available files...</span>
                </div>
            );
        }

        if (files.length > 0) {
            return (
                <div className="overflow-x-auto rounded-b-xl">
                    <table className="min-w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">File Type</th>
                                <th scope="col" className="px-6 py-3">File Name</th>
                                <th scope="col" className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map(file => {
                                const isDownloadingThisFile = downloadingUrl === file.url;
                                const resolution = getResolution(file.type);
                                return (
                                <tr key={file.url} className="border-b border-slate-700 hover:bg-slate-800/60 transition-colors duration-150 last:border-b-0">
                                    <th scope="row" className="px-6 py-4 font-medium whitespace-nowrap flex items-center">
                                        {renderFileIcon(file.type)}
                                        <span>{file.type}</span>
                                        {resolution && settings.advancedInfo && (
                                            <div className="group relative inline-flex items-center ml-2">
                                                <button type="button" className="focus:outline-none" aria-label="Resolution Info">
                                                    <InformationCircleIcon className="w-4 h-4 text-slate-500 hover:text-brand-cyan cursor-help transition-colors duration-200" />
                                                </button>
                                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-auto sm:bottom-full sm:left-1/2 sm:translate-y-0 sm:-translate-x-1/2 mb-0 sm:mb-2 hidden group-hover:block group-focus-within:block w-max max-w-[90vw] sm:max-w-none px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100]">
                                                    <span className="text-brand-cyan font-mono text-xs font-bold">{resolution}</span>
                                                    <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                    </th>
                                    <td className="px-6 py-4 font-mono">{file.name}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownloadClick(file)}
                                            disabled={!!downloadingUrl}
                                            className="inline-flex items-center justify-center gap-2 min-w-[140px] font-bold text-brand-cyan hover:text-cyan-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isDownloadingThisFile ? (
                                                <>
                                                    <Spinner />
                                                    <span>Downloading Asset...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                                    <span>Download Asset</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center h-40 text-slate-500 rounded-b-xl">
                <p>No files found for this song.</p>
            </div>
        );
    };

    if (!selectedSong) {
        return (
            <div className="relative w-full mx-auto overflow-hidden rounded-xl border border-dashed border-slate-700 bg-transparent p-6 text-center">
                <p className="text-slate-500">Select a song from the dropdown menu above to view available files for download.</p>
                <p className="text-slate-500"></p>
            </div>
        );
    }
    
    return (
        <>
            <AssetDownloadWarningPopup 
                isOpen={showAssetWarning}
                onConfirm={handleWarningConfirm}
                onCancel={handleWarningCancel}
            />
            <div className="relative w-full mx-auto rounded-xl border border-slate-700 bg-slate-800/50 shadow-lg backdrop-blur-sm">
                 <div className="px-6 py-4 border-b border-slate-700 rounded-t-xl">
                    <h3 className="font-bold text-lg text-slate-200 flex flex-wrap items-center gap-2">
                        <span>Available Files for <span className="text-brand-cyan">{selectedSong.name}</span></span>
                        
                        {settings.advancedInfo && (
                            <div className="group relative inline-flex items-center">
                                <button type="button" className="focus:outline-none" aria-label="Show Song ID">
                                    <InformationCircleIcon className="w-5 h-5 text-slate-500 hover:text-brand-cyan cursor-help transition-colors duration-200" />
                                </button>
                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-auto sm:bottom-full sm:left-1/2 sm:translate-y-0 sm:-translate-x-1/2 mb-0 sm:mb-2 hidden group-hover:block group-focus-within:block w-max max-w-[90vw] sm:max-w-[250px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-[100]">
                                    <div className="text-center">
                                        <span className="text-slate-500 font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Song ID</span>
                                        <span className="font-mono text-sm text-brand-cyan select-all break-all leading-tight">{selectedSong.id}</span>
                                    </div>
                                    <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                                </div>
                            </div>
                        )}
                    </h3>
                </div>
                {renderContent()}
            </div>
        </>
    );
};
