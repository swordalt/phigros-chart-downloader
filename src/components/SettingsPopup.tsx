
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { defaultSettings } from '../defaultSettings';
import { PROXY_SOURCES, ProxySource } from '../utils/resourceUrls';

export type SettingsCategory = 'export' | 'visual' | 'proxy' | 'advanced';

interface SettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: SettingsCategory;
}

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

const CATEGORIES: { id: SettingsCategory; label: string }[] = [
    { id: 'export', label: 'Export' },
    { id: 'visual', label: 'App UI' },
    { id: 'proxy', label: 'Proxy' },
    { id: 'advanced', label: 'Advanced' },
];

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled }) => (
    <button
        type="button"
        disabled={disabled}
        className={`${
            enabled ? 'bg-brand-cyan' : 'bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:shadow-brand-cyan/10'} motion-switch relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-slate-900`}
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && onChange(!enabled)}
    >
        <span
            aria-hidden="true"
            className={`${
                enabled ? 'translate-x-5' : 'translate-x-0'
            } ${disabled ? 'motion-switch-thumb-disabled' : ''} motion-switch-thumb pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0`}
        />
    </button>
);

export const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose, initialCategory = 'export' }) => {
    const { settings, setSettings } = useSettings();
    const [confirmReset, setConfirmReset] = useState(false);
    const [category, setCategory] = useState<SettingsCategory>(initialCategory);

    useEffect(() => {
        if (!isOpen) {
            setConfirmReset(false);
        } else {
            setCategory(initialCategory);
        }
    }, [isOpen, initialCategory]);

    if (!isOpen) return null;

    const handleResetConfirm = () => {
        setSettings(defaultSettings);
        setConfirmReset(false);
    };

    const handleChangeExportFormat = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({ ...prev, useZipFormat: e.target.value === 'zip' }));
    };

    const handleChangeExportIllustrationType = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({ ...prev, exportIllustrationType: e.target.value as 'full' | 'blur' }));
    };

    const handleChangeChartFormatConversion = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings(prev => ({ ...prev, chartFormatConversion: e.target.value as 'none' | 'rpe' }));
    };

    const handleToggleEasingFitting = () => {
        setSettings(prev => ({ ...prev, chartEasingFitting: !prev.chartEasingFitting }));
    };

    const handleToggleAnalytics = () => {
        setSettings(prev => ({ ...prev, analyticsEnabled: !prev.analyticsEnabled }));
    };

    const handleToggleAudioPreview = () => {
        setSettings(prev => ({ ...prev, newUiAudioPreview: !prev.newUiAudioPreview }));
    };

    const handleChangeAudioVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, newUiAudioVolume: Number(e.target.value) }));
    };

    const handleToggleLoopAudio = () => {
        setSettings(prev => ({ ...prev, newUiLoopAudio: !prev.newUiLoopAudio }));
    };

    const handleToggleShowVisualizer = () => {
        setSettings(prev => ({ ...prev, newUiShowVisualizer: !prev.newUiShowVisualizer }));
    };

    const handleChangeVisualizerColor = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, newUiVisualizerColor: e.target.value }));
    };

    const handleChangeVisualizerHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, newUiVisualizerHeight: Number(e.target.value) }));
    };

    const handleChangeVisualizerOpacity = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, newUiVisualizerOpacity: Number(e.target.value) }));
    };

    const handleToggleSongEffects = () => {
        setSettings(prev => ({ ...prev, newUiSongSpecificEffects: !prev.newUiSongSpecificEffects }));
    };

    const handleToggleAdvancedInfo = () => {
        setSettings(prev => ({ ...prev, advancedInfo: !prev.advancedInfo }));
    };

    const handleToggleBulkDownloadMode = () => {
        setSettings(prev => ({ ...prev, bulkDownloadMode: !prev.bulkDownloadMode }));
    };

    const handleSelectProxy = (id: ProxySource) => {
        setSettings(prev => ({ ...prev, proxySource: id }));
    };

    const renderExport = () => (
        <div className="divide-y divide-slate-700/50 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Chart File Extension</p>
                    <p className="text-sm text-slate-400">The extension to use for exported charts. Certain browsers will override this.</p>
                </div>
                <select
                    value={settings.useZipFormat ? 'zip' : 'pez'}
                    onChange={handleChangeExportFormat}
                    className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-cyan cursor-pointer"
                >
                    <option value="pez">PEZ</option>
                    <option value="zip">ZIP</option>
                </select>
            </div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Chart Illustration</p>
                    <p className="text-sm text-slate-400">The type of illustration to use for exported charts.</p>
                </div>
                <select
                    value={settings.exportIllustrationType}
                    onChange={handleChangeExportIllustrationType}
                    className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-cyan cursor-pointer"
                >
                    <option value="full">Full Size</option>
                    <option value="blur">Blur</option>
                </select>
            </div>
            <div>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-slate-200">Chart Format Conversion</p>
                        <p className="text-sm text-slate-400">Convert chart data in exported charts into other formats to support other editors.</p>
                    </div>
                    <select
                        value={settings.chartFormatConversion}
                        onChange={handleChangeChartFormatConversion}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-brand-cyan cursor-pointer"
                    >
                        <option value="none">None</option>
                        <option value="rpe">To RPE</option>
                    </select>
                </div>
                <div className={`mt-3 ml-1 pl-4 border-l-2 border-slate-700 flex items-center justify-between gap-4 transition-opacity duration-200 ${settings.chartFormatConversion === 'none' ? 'opacity-50' : ''}`}>
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Easing Fit</p>
                        <p className="text-xs text-slate-400">Re-construct cut events into larger eased ones. Saves file size; recommended for editing within RPE.</p>
                    </div>
                    <ToggleSwitch
                        enabled={settings.chartEasingFitting}
                        onChange={handleToggleEasingFitting}
                        disabled={settings.chartFormatConversion === 'none'}
                    />
                </div>
            </div>
        </div>
    );

    const renderVisual = () => (
        <div className="divide-y divide-slate-700/50 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Audio (WIP)</p>
                    <p className="text-sm text-slate-400">Automatically play the currently-selected song's audio.</p>
                </div>
                <ToggleSwitch
                    enabled={settings.newUiAudioPreview}
                    onChange={handleToggleAudioPreview}
                />
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Audio Volume</p>
                    <p className="text-sm text-slate-400">The volume of the audio player.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.newUiAudioVolume}
                        onChange={handleChangeAudioVolume}
                        disabled={!settings.newUiAudioPreview}
                        className="w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:accent-cyan-300 focus:outline-none disabled:opacity-50"
                    />
                    <span className="text-sm font-mono text-slate-400 w-9 text-right">{Math.round(settings.newUiAudioVolume * 100)}%</span>
                </div>
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Audio Looping</p>
                    <p className="text-sm text-slate-400">Automatically loop back to the beginning.</p>
                </div>
                <ToggleSwitch
                    enabled={settings.newUiLoopAudio}
                    onChange={handleToggleLoopAudio}
                    disabled={!settings.newUiAudioPreview}
                />
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Audio Visualizer</p>
                    <p className="text-sm text-slate-400">Show a bar visualizer of the audio.</p>
                </div>
                <ToggleSwitch
                    enabled={settings.newUiShowVisualizer}
                    onChange={handleToggleShowVisualizer}
                    disabled={!settings.newUiAudioPreview}
                />
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiShowVisualizer || !settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Visualizer Color</p>
                    <p className="text-sm text-slate-400">Enter a color code, name, or hex. Alternatively, click to pick a color.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg border border-slate-600 shadow-inner overflow-hidden shrink-0 transition-colors focus-within:ring-2 focus-within:ring-brand-cyan focus-within:ring-offset-2 focus-within:ring-offset-slate-900">
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ backgroundColor: settings.newUiVisualizerColor }}
                        />
                        <input
                            type="color"
                            value={
                                /^#[0-9A-Fa-f]{6}$/.test(settings.newUiVisualizerColor)
                                ? settings.newUiVisualizerColor
                                : '#808080'
                            }
                            onChange={handleChangeVisualizerColor}
                            disabled={!settings.newUiShowVisualizer || !settings.newUiAudioPreview}
                            className="opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Choose visualizer color"
                        />
                    </div>
                    <input
                        type="text"
                        value={settings.newUiVisualizerColor}
                        onChange={handleChangeVisualizerColor}
                        disabled={!settings.newUiShowVisualizer || !settings.newUiAudioPreview}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded px-3 py-2 w-28 focus:outline-none focus:border-brand-cyan disabled:opacity-50 disabled:cursor-not-allowed font-mono text-center uppercase"
                        placeholder="#RRGGBB"
                    />
                </div>
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiShowVisualizer || !settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Visualizer Height</p>
                    <p className="text-sm text-slate-400">Changes the maximum height of the visualizer bars.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={settings.newUiVisualizerHeight}
                        onChange={handleChangeVisualizerHeight}
                        disabled={!settings.newUiShowVisualizer || !settings.newUiAudioPreview}
                        className="w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:accent-cyan-300 focus:outline-none disabled:opacity-50"
                    />
                    <span className="text-sm font-mono text-slate-400 w-8 text-right">{settings.newUiVisualizerHeight}%</span>
                </div>
            </div>

            <div className={`flex items-center justify-between gap-4 transition-opacity duration-200 ${!settings.newUiShowVisualizer || !settings.newUiAudioPreview ? 'opacity-50' : ''}`}>
                <div>
                    <p className="font-semibold text-slate-200">Visualizer Opacity</p>
                    <p className="text-sm text-slate-400">Adjusts the transparency of the visualizer bars.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={settings.newUiVisualizerOpacity}
                        onChange={handleChangeVisualizerOpacity}
                        disabled={!settings.newUiShowVisualizer || !settings.newUiAudioPreview}
                        className="w-24 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:accent-cyan-300 focus:outline-none disabled:opacity-50"
                    />
                    <span className="text-sm font-mono text-slate-400 w-8 text-right">{settings.newUiVisualizerOpacity}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Song-Specific Effects (WIP)</p>
                    <p className="text-sm text-slate-400">Shows unique 'anomaly' effects when ✨CERTAIN✨ songs are selected. May cause lag.<br/>(Some effects require 'Audio Preview' to work, as they are synced to the song.)</p>
                </div>
                <ToggleSwitch
                    enabled={settings.newUiSongSpecificEffects}
                    onChange={handleToggleSongEffects}
                />
            </div>
        </div>
    );

    const renderProxy = () => (
        <div>
            <p className="font-semibold text-slate-200">Proxy Source</p>
            <p className="text-sm text-slate-400 mb-4">
                Proxies may help with accessing GitHub in restricted regions or avoiding rate limits. Use GitHub official whenever possible.
            </p>
            <div className="space-y-3">
                {PROXY_SOURCES.map((option) => {
                    const isSelected = settings.proxySource === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectProxy(option.id)}
                            aria-pressed={isSelected}
                            className={`w-full text-left rounded-lg border px-4 py-3 transition-colors duration-200 flex items-start gap-3 ${
                                isSelected
                                    ? 'border-brand-cyan bg-brand-cyan/10'
                                    : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                    isSelected ? 'border-brand-cyan' : 'border-slate-500'
                                }`}
                            >
                                {isSelected && <span className="h-2 w-2 rounded-full bg-brand-cyan" />}
                            </span>
                            <span>
                                <p className="font-semibold text-slate-200">{option.label}</p>
                                <p className="text-sm text-slate-400">{option.description}</p>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderAdvanced = () => (
        <div className="divide-y divide-slate-700/50 [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Advanced Info</p>
                    <p className="text-sm text-slate-400">Enables tooltips containing advanced information (e.g., Song ID, illustration resolution).</p>
                </div>
                <ToggleSwitch enabled={settings.advancedInfo} onChange={handleToggleAdvancedInfo} />
            </div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Analytics</p>
                    <p className="text-sm text-slate-400">Sends anonymous statistics about downloaded charts. Disable to only send an anonymized ID instead of the chart name and difficulty.<br />(Note: Uses a Discord webhook.)</p>
                </div>
                <ToggleSwitch enabled={settings.analyticsEnabled} onChange={handleToggleAnalytics} />
            </div>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-200">Bulk Download Mode (WIP)</p>
                    <p className="text-sm text-slate-400">Allows for the bulk export of assets and charts.</p>
                </div>
                <ToggleSwitch enabled={settings.bulkDownloadMode} onChange={handleToggleBulkDownloadMode} />
            </div>
        </div>
    );

    return (
        <div
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="settings-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`motion-dialog relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl p-6 text-left transform transition-all ${
                    settings.useNewUi ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-slate-900'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <h2 id="settings-title" className="text-2xl font-bold text-brand-cyan mb-6">
                    Settings
                </h2>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <nav
                        className="flex sm:flex-col sm:w-40 flex-shrink-0 overflow-x-auto sm:overflow-visible divide-x sm:divide-x-0 sm:divide-y divide-slate-700 border-b sm:border-b-0 sm:border-r border-slate-700 pb-4 sm:pb-0 sm:pr-4"
                        role="tablist"
                        aria-label="Settings categories"
                    >
                        {CATEGORIES.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={category === id}
                                onClick={() => setCategory(id)}
                                className={`px-4 py-3.5 text-left font-semibold transition-colors duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-cyan ${
                                    category === id
                                        ? 'bg-brand-cyan/10 text-brand-cyan'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1 min-w-0 h-[50vh] overflow-y-auto pr-2 custom-scrollbar scroll-fade" role="tabpanel">
                        {category === 'export' && renderExport()}
                        {category === 'visual' && renderVisual()}
                        {category === 'proxy' && renderProxy()}
                        {category === 'advanced' && renderAdvanced()}
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4 min-h-[44px]">
                    {confirmReset ? (
                        <div className="flex items-center gap-3 animate-pulse">
                            <span className="text-slate-300 text-sm font-semibold mr-2">Are you sure?</span>
                            <button
                                onClick={handleResetConfirm}
                                className="px-4 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setConfirmReset(false)}
                                className="px-4 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-700 hover:bg-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmReset(true)}
                                className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-700"
                            >
                                Reset Defaults
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
