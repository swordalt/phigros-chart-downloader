import { ProxySource } from './utils/resourceUrls';

export interface Settings {
    useZipFormat: boolean;
    analyticsEnabled: boolean;
    exportIllustrationType: 'full' | 'blur';
    chartFormatConversion: 'none' | 'rpe';
    chartEasingFitting: boolean;
    useNewUi: boolean;
    proxySource: ProxySource;
    githubToken: string;
    // New UI Sub-settings
    newUiAudioPreview: boolean;
    newUiAudioVolume: number;
    newUiLoopAudio: boolean;
    newUiBlur: boolean;
    bulkDownloadMode: boolean;
    advancedInfo: boolean;
}

export const defaultSettings: Settings = {
    useZipFormat: false,
    analyticsEnabled: true,
    exportIllustrationType: 'full',
    chartFormatConversion: 'rpe',
    chartEasingFitting: true,
    useNewUi: true,
    proxySource: 'github',
    githubToken: '',
    newUiAudioPreview: true,
    newUiAudioVolume: 1,
    newUiLoopAudio: true,
    newUiBlur: false,
    bulkDownloadMode: false,
    advancedInfo: false,
};
