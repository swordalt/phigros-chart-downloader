import JSZip from 'jszip';
import { FileInfo, Song } from '../types';
import { Settings } from '../defaultSettings';

// Define message types for type safety
export type ExportMessage =
    | { type: 'exportAllAssets'; files: FileInfo[]; selectedSong: Song }
    | { type: 'exportChart'; files: FileInfo[]; selectedSong: Song; selectedDifficulty: string; settings: Settings }
    | { type: 'exportBulkAssets'; songs: Song[]; delaySeconds: number };

export type WorkerResponse =
    | { type: 'progress'; progress: number }
    | { type: 'bulkProgress'; currentFile: string; action: 'Downloading' | 'Zipping' | 'Waiting'; songsLeft: number; percent?: number }
    | { type: 'complete'; blob: Blob; fileName: string; chartId?: string }
    | { type: 'error'; error: string };

const ctx: Worker = self as unknown as Worker;

ctx.onmessage = async (event: MessageEvent<ExportMessage>) => {
    const { type } = event.data;

    try {
        if (type === 'exportAllAssets') {
            await handleExportAllAssets(event.data.files, event.data.selectedSong);
        } else if (type === 'exportChart') {
            await handleExportChart(event.data.files, event.data.selectedSong, event.data.selectedDifficulty, event.data.settings);
        } else if (type === 'exportBulkAssets') {
            await handleExportBulkAssets(event.data.songs, event.data.delaySeconds);
        }
    } catch (error) {
        ctx.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
    }
};

const handleExportAllAssets = async (files: FileInfo[], selectedSong: Song) => {
    const zip = new JSZip();
    const chartsFolder = zip.folder('charts');
    if (!chartsFolder) throw new Error("Could not create 'charts' folder in zip.");

    const filePromises = files.map(file =>
        fetch(file.url, { referrerPolicy: 'no-referrer' }).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${file.url}: ${res.statusText}`);
            return res.blob();
        })
    );

    const blobs = await Promise.all(filePromises);

    blobs.forEach((blob, index) => {
        const fileInfo = files[index];
        if (fileInfo.type === 'Illustration') {
            zip.file('illustration.png', blob);
        } else if (fileInfo.type === 'Audio') {
            zip.file('music.ogg', blob);
        } else if (fileInfo.type.startsWith('Chart')) {
            chartsFolder.file(fileInfo.name, blob);
        }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        ctx.postMessage({ type: 'progress', progress: metadata.percent });
    });

    const safeSongName = selectedSong.name.replace(/\s/g, '_').replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${safeSongName}_all-assets.zip`;

    ctx.postMessage({ type: 'complete', blob: zipBlob, fileName });
};

const handleExportChart = async (
    files: FileInfo[],
    selectedSong: Song,
    selectedDifficulty: string,
    settings: Settings
) => {
    const chartFile = files.find(f => f.type === `Chart (${selectedDifficulty})`);
    
    // Select Illustration based on settings
    let illustrationFile: FileInfo | undefined;
    
    if (settings.exportIllustrationType === 'blur') {
        illustrationFile = files.find(f => f.type === 'Illustration (Blur)');
    }
    
    // Fallback to Full Size if blur isn't selected or not found
    if (!illustrationFile) {
        illustrationFile = files.find(f => f.type === 'Illustration');
    }

    // Final fallback to any illustration type (e.g. Low-Res)
    if (!illustrationFile) {
        illustrationFile = files.find(f => f.type.startsWith('Illustration'));
    }

    const audioFile = files.find(f => f.type === 'Audio');

    if (!chartFile || !illustrationFile || !audioFile) {
        throw new Error('Could not find all required files (chart, illustration, audio) for export.');
    }

    const chartId = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
    const charter = selectedSong.charters[selectedDifficulty as keyof typeof selectedSong.charters] || 'Pigeon Games';

    // Difficulty Processing
    const diffKey = selectedDifficulty as keyof typeof selectedSong.difficulties;
    let difficultyValStr = selectedSong.difficulties?.[diffKey];
    
    // Default to 0 if missing or if difficulty is not one of EZ/HD/IN/AT
    if (!difficultyValStr) {
        difficultyValStr = '0';
    }

    const difficultyVal = parseFloat(difficultyValStr);
    const difficultyInt = Math.floor(difficultyVal);
    const levelString = `${selectedDifficulty} Lv.${difficultyInt}`;

    const infoTemplate = `#
Name: {SONG_NAME}
Path: {CHART_ID}
Song: {CHART_ID}.ogg
Picture: {CHART_ID}.png
Chart: {CHART_ID}.json
Level: {LEVEL_STRING}
Composer: {COMPOSER}
Charter: {CHARTER}`;

    const infoContent = infoTemplate
        .replace(/{CHART_ID}/g, chartId)
        .replace('{SONG_NAME}', selectedSong.name)
        .replace('{LEVEL_STRING}', levelString)
        .replace('{COMPOSER}', selectedSong.composer)
        .replace('{CHARTER}', charter);

    const [chartBlob, illustrationBlob, audioBlob] = await Promise.all([
        fetch(chartFile.url).then(res => res.blob()),
        fetch(illustrationFile.url).then(res => res.blob()),
        fetch(audioFile.url).then(res => res.blob()),
    ]);

    const zip = new JSZip();
    zip.file("info.txt", infoContent);
    zip.file(`${chartId}.json`, chartBlob);
    zip.file(`${chartId}.png`, illustrationBlob);
    zip.file(`${chartId}.ogg`, audioBlob);

    if (settings.includeInfoYml) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}/${month}/${year}`;

         const ymlContent = `name: ${JSON.stringify(selectedSong.name)}
difficulty: ${difficultyVal}
level: ${JSON.stringify(levelString)}
charter: ${JSON.stringify(charter)}
composer: ${JSON.stringify(selectedSong.composer)}
illustrator: "Phigros"
chart: "${chartId}.json"
format: null
music: "${chartId}.ogg"
illustration: "${chartId}.png"
unlockVideo: null
previewStart: 0.0
previewEnd: 20.0
aspectRatio: 1.7777778
backgroundDim: 0.6
lineLength: 6.0
offset: 0.0
tip: null
tags: []
intro: "Phigros Chart Downloader - ${dateStr}" 
holdPartialCover: false
created: null
updated: null
chartUpdated: null`;
        zip.file("info.yml", ymlContent);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        ctx.postMessage({ type: 'progress', progress: metadata.percent });
    });

    const fileExtension = settings.useZipFormat ? 'zip' : 'pez';
    const safeSongName = selectedSong.name.replace(/\s/g, '_').replace(/[<>:"/\\|?*]/g, '');
    const fileName = `${safeSongName}_${selectedDifficulty}.${fileExtension}`;

    ctx.postMessage({ type: 'complete', blob: zipBlob, fileName, chartId });
};

const handleExportBulkAssets = async (songs: Song[], delaySeconds: number) => {
    const zip = new JSZip();

    for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const safeSongName = song.name.replace(/\s/g, '_').replace(/[<>:"/\\|?*]/g, '');
        const songFolder = zip.folder(safeSongName);
        if (!songFolder) continue;

        const chartsFolder = songFolder.folder('charts');
        if (!chartsFolder) continue;

        const songId = song.id;

        // Files to try fetching
        const filesToTry = [
            { type: 'Illustration', name: 'illustration.png', url: `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustration/${songId}.png` },
            { type: 'Illustration (Low-Res)', name: 'illustration_low.png', url: `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustrationLowRes/${songId}.png` },
            { type: 'Illustration (Blur)', name: 'illustration_blur.png', url: `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/illustrationBlur/${songId}.png` },
            { type: 'Audio', name: 'music.ogg', url: `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/music/${songId}.ogg` },
        ];

        const difficulties = ['EZ', 'HD', 'IN', 'AT'];
        difficulties.forEach(diff => {
            filesToTry.push({
                type: `Chart (${diff})`,
                name: `${diff}.json`,
                url: `https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/chart/${songId}.0/${diff}.json`
            });
        });

        for (const file of filesToTry) {
            ctx.postMessage({ 
                type: 'bulkProgress', 
                currentFile: `${song.name} - ${file.type}`, 
                action: 'Downloading', 
                songsLeft: songs.length - i 
            });

            try {
                const res = await fetch(file.url, { referrerPolicy: 'no-referrer' });
                if (res.ok) {
                    const blob = await res.blob();
                    if (file.type.startsWith('Chart')) {
                        chartsFolder.file(file.name, blob);
                    } else {
                        songFolder.file(file.name, blob);
                    }
                }
            } catch (e) {
                // Ignore fetch errors for individual files
            }
        }

        // Apply delay between songs (except for the last song)
        if (i < songs.length - 1 && delaySeconds > 0) {
            ctx.postMessage({ 
                type: 'bulkProgress', 
                currentFile: `Waiting ${delaySeconds}s before next song...`, 
                action: 'Waiting', 
                songsLeft: songs.length - i - 1 
            });
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
    }

    ctx.postMessage({ 
        type: 'bulkProgress', 
        currentFile: 'All files downloaded', 
        action: 'Zipping', 
        songsLeft: 0 
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        ctx.postMessage({ 
            type: 'bulkProgress', 
            currentFile: 'Zipping...', 
            action: 'Zipping', 
            songsLeft: 0,
            percent: metadata.percent
        });
    });

    ctx.postMessage({ type: 'complete', blob: zipBlob, fileName: 'Phigros_All_Assets.zip' });
};
