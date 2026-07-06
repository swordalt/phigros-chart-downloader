
import FileSaver from 'file-saver';
import { FileInfo, Song } from '../types';
import { Settings } from '../defaultSettings';
import { sendAllAssetsDownloadNotification, sendChartDownloadNotification } from './api';

// Worker interface (matching the worker definition)
interface WorkerResponse {
    type: 'progress' | 'bulkProgress' | 'complete' | 'error';
    progress?: number;
    currentFile?: string;
    action?: 'Downloading' | 'Zipping' | 'Waiting';
    songsLeft?: number;
    percent?: number;
    blob?: Blob;
    fileName?: string;
    chartId?: string;
    error?: string;
}

type ExportMessage =
    | { type: 'exportAllAssets'; files: FileInfo[]; selectedSong: Song }
    | { type: 'exportChart'; files: FileInfo[]; selectedSong: Song; selectedDifficulty: string; settings: Settings }
    | { type: 'exportBulkAssets'; songs: Song[]; delaySeconds: number };

const runWorker = (
    message: ExportMessage, 
    onProgress?: (progress: number) => void,
    onBulkProgress?: (currentFile: string, action: 'Downloading' | 'Zipping' | 'Waiting', songsLeft: number, percent?: number) => void,
    signal?: AbortSignal
): Promise<{ blob: Blob, fileName: string, chartId?: string }> => {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../worker/export.worker.ts', import.meta.url), { type: 'module' });

        const onAbort = () => {
            worker.terminate();
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
        };

        if (signal) {
            if (signal.aborted) {
                onAbort();
                return;
            }
            signal.addEventListener('abort', onAbort);
        }

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, progress, currentFile, action, songsLeft, percent, blob, fileName, chartId, error } = event.data;

            if (type === 'progress' && progress !== undefined && onProgress) {
                onProgress(progress);
            } else if (type === 'bulkProgress' && currentFile && action && songsLeft !== undefined && onBulkProgress) {
                onBulkProgress(currentFile, action, songsLeft, percent);
            } else if (type === 'complete' && blob && fileName) {
                if (signal) signal.removeEventListener('abort', onAbort);
                resolve({ blob, fileName, chartId });
                worker.terminate();
            } else if (type === 'error') {
                if (signal) signal.removeEventListener('abort', onAbort);
                reject(new Error(error || 'Unknown worker error'));
                worker.terminate();
            }
        };

        worker.onerror = (error) => {
            if (signal) signal.removeEventListener('abort', onAbort);
            reject(error);
            worker.terminate();
        };

        worker.postMessage(message);
    });
};

export const exportAllAssets = async (
    files: FileInfo[], 
    selectedSong: Song, 
    settings: Settings,
    onProgress: (progress: number) => void
) => {
    try {
        const { blob, fileName } = await runWorker({
            type: 'exportAllAssets',
            files,
            selectedSong
        }, onProgress);

        FileSaver.saveAs(blob, fileName);

        if (!settings.disableDiscordNotifications) {
            sendAllAssetsDownloadNotification(selectedSong.name);
        }
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};

export const exportChart = async (
    files: FileInfo[],
    selectedSong: Song,
    selectedDifficulty: string,
    settings: Settings,
    onProgress: (progress: number) => void
) => {
    try {
        const { blob, fileName, chartId } = await runWorker({
            type: 'exportChart',
            files,
            selectedSong,
            selectedDifficulty,
            settings
        }, onProgress);

        FileSaver.saveAs(blob, fileName);

        if (!settings.disableDiscordNotifications) {
            sendChartDownloadNotification(selectedSong.name, selectedDifficulty, chartId || 'Unknown');
        }
    } catch (error) {
        console.error("Export failed:", error);
        throw error;
    }
};

export const exportBulkAssets = async (
    songs: Song[],
    delaySeconds: number,
    onBulkProgress: (currentFile: string, action: 'Downloading' | 'Zipping' | 'Waiting', songsLeft: number, percent?: number) => void,
    signal?: AbortSignal
) => {
    try {
        const { blob, fileName } = await runWorker({
            type: 'exportBulkAssets',
            songs,
            delaySeconds
        }, undefined, onBulkProgress, signal);

        FileSaver.saveAs(blob, fileName);
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log("Bulk export cancelled.");
            return;
        }
        console.error("Bulk export failed:", error);
        throw error;
    }
};
