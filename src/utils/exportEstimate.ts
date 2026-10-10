import { FileInfo } from '../types';

// Chart, PNG and OGG are all already compressed, so zipping barely changes them and they count at full size.
// info.txt + info.yml + zip headers
const ZIP_OVERHEAD_BYTES = 2048;

/** Estimated size of the Phira/RPE export zip (chart + illustration + audio) for one difficulty, or null if unknown. */
export const estimateExportZipSize = (
    files: FileInfo[],
    difficulty: string,
    illustrationType: 'full' | 'blur'
): number | null => {
    const chart = files.find(f => f.type === `Chart (${difficulty})`);
    const audio = files.find(f => f.type === 'Audio');
    // Same illustration priority as the export worker.
    const illustration =
        (illustrationType === 'blur' ? files.find(f => f.type === 'Illustration (Blur)') : undefined)
        ?? files.find(f => f.type === `Illustration (${difficulty})`)
        ?? files.find(f => f.type === 'Illustration')
        ?? files.find(f => f.type.startsWith('Illustration'));

    if (!chart?.size || !illustration?.size || !audio?.size) return null;
    return Math.round(chart.size + illustration.size + audio.size + ZIP_OVERHEAD_BYTES);
};

export const formatEstimate = (bytes: number): string =>
    bytes >= 1024 * 1024 ? `~${(bytes / (1024 * 1024)).toFixed(1)} MB` : `~${Math.max(1, Math.round(bytes / 1024))} KB`;
