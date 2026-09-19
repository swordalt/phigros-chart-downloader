
export interface Settings {
    useZipFormat: boolean;
    analyticsEnabled: boolean;
    exportIllustrationType: 'full' | 'blur';
    useNewUi: boolean;
    // New UI Sub-settings
    newUiAudioPreview: boolean;
    newUiAudioVolume: number;
    newUiLoopAudio: boolean;
    newUiShowVisualizer: boolean;
    newUiVisualizerColor: string;
    newUiVisualizerHeight: number;
    newUiVisualizerOpacity: number;
    newUiSongSpecificEffects: boolean;
    bulkDownloadMode: boolean;
}

export const defaultSettings: Settings = {
    useZipFormat: false,
    analyticsEnabled: true,
    exportIllustrationType: 'full',
    useNewUi: true,
    newUiAudioPreview: false,
    newUiAudioVolume: 1,
    newUiLoopAudio: true,
    newUiShowVisualizer: true,
    newUiVisualizerColor: 'gray', // slate-200
    newUiVisualizerHeight: 60,
    newUiVisualizerOpacity: 60,
    newUiSongSpecificEffects: false,
    bulkDownloadMode: false,
};
