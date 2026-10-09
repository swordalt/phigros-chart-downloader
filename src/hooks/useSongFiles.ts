import { useEffect, useState } from 'react';
import { Song, FileInfo } from '../types';
import { probeUrl } from '../utils/api';
import { getResourceUrl, hasPerDifficultyIllustrations, getDifficultyIllustrationUrl, ILLUSTRATION_DIFFICULTIES, ProxySource } from '../utils/resourceUrls';
import { getExtraCharts } from '../extraCharts';
import { DIFFICULTY_ORDER } from '../utils/difficulty';

/** Checks which assets exist for the selected song. */
export const useSongFiles = (selectedSong: Song | null, proxySource: ProxySource) => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setFiles([]);
        if (!selectedSong) {
            setIsLoading(false);
            return;
        }

        const abortController = new AbortController();
        const songId = selectedSong.id;

        // Resolves to the file when it exists (with its size if known), otherwise null.
        const probe = async (file: FileInfo): Promise<FileInfo | null> => {
            if (abortController.signal.aborted) return null;
            const { exists, size } = await probeUrl(file.url);
            return exists ? { ...file, size: size ?? undefined } : null;
        };

        const filesToFind: Promise<FileInfo | null>[] = [];

        filesToFind.push(probe({ type: 'Illustration', name: `${songId}.png`, url: getResourceUrl(proxySource, 'illustration', `${songId}.png`) }));

        // Per-difficulty illustrations (song-specific)
        if (hasPerDifficultyIllustrations(songId)) {
            ILLUSTRATION_DIFFICULTIES.forEach(diff => {
                filesToFind.push(probe({ type: `Illustration (${diff})`, name: `${songId}_${diff}.png`, url: getDifficultyIllustrationUrl(proxySource, songId, diff) }));
            });
        }

        filesToFind.push(probe({ type: 'Illustration (Low-Res)', name: `${songId}.png`, url: getResourceUrl(proxySource, 'illustrationLowRes', `${songId}.png`) }));
        filesToFind.push(probe({ type: 'Illustration (Blur)', name: `${songId}.png`, url: getResourceUrl(proxySource, 'illustrationBlur', `${songId}.png`) }));
        filesToFind.push(probe({ type: 'Audio', name: `${songId}.ogg`, url: getResourceUrl(proxySource, 'music', `${songId}.ogg`) }));

        DIFFICULTY_ORDER.forEach(diff => {
            const file: FileInfo = {
                type: `Chart (${diff})`,
                name: `${diff}.json`,
                url: getResourceUrl(proxySource, 'chart', `${songId}.0/${diff}.json`),
            };
            if (!selectedSong.difficulties) {
                // No metadata: find out which charts exist.
                filesToFind.push(probe(file));
            } else if (selectedSong.difficulties[diff]) {
                filesToFind.push(Promise.resolve(file));
            }
        });

        // Charts that exist but are not listed in the metadata
        getExtraCharts(songId).forEach(extra => {
            const fileName = `${extra.difficulty}.json`;
            filesToFind.push(Promise.resolve({
                type: `Chart (${extra.difficulty})`,
                name: fileName,
                url: getResourceUrl(proxySource, 'chart', `${songId}.0/${fileName}`),
                tooltip: extra.tooltip,
            }));
        });

        setIsLoading(true);
        Promise.all(filesToFind)
            .then(results => {
                if (abortController.signal.aborted) return;
                setFiles(results.filter((file): file is FileInfo => file !== null));
            })
            .catch(error => {
                if (!abortController.signal.aborted) console.error('Error fetching files:', error);
            })
            .finally(() => {
                if (!abortController.signal.aborted) setIsLoading(false);
            });

        return () => abortController.abort();
    }, [selectedSong, proxySource]);

    return { files, isLoading };
};

export const getChartDifficulty = (file: FileInfo): string | null => {
    const match = file.type.match(/^Chart \(([^)]+)\)$/);
    return match ? match[1] : null;
};
