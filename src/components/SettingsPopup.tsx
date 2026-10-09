import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { defaultSettings, Settings } from '../defaultSettings';
import { PROXY_SOURCES } from '../utils/resourceUrls';
import { DialogFrame, DialogHeader, Button } from './ui/Dialog';

export type SettingsCategory = 'export' | 'visual' | 'proxy' | 'advanced';

interface SettingsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: SettingsCategory;
}

const CATEGORIES: { id: SettingsCategory; label: string }[] = [
    { id: 'export', label: 'Export' },
    { id: 'visual', label: 'App UI' },
    { id: 'proxy', label: 'Network' },
    { id: 'advanced', label: 'Advanced' },
];

const PROXY_TAGS: Record<string, string> = {
    github: 'DEFAULT',
    jsdelivr: 'CDN',
    'jsdelivr-gcore': 'CDN',
    'ghproxy-net': 'OTHER',
    'ghfast-top': 'OTHER',
};

// --- Controls ---

const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }> = ({ enabled, onChange, disabled, label }) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className="relative w-[42px] h-6 rounded-full transition-colors duration-200 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60"
        style={{ background: enabled ? '#22d3ee' : 'rgba(255,255,255,0.12)' }}
    >
        <span
            className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full transition-transform duration-200"
            style={{ background: enabled ? '#06141a' : '#cbd5e1', transform: `translateX(${enabled ? 18 : 0}px)` }}
        />
    </button>
);

function Segmented<T extends string | boolean>({ value, options, onChange, disabled }: {
    value: T;
    options: [T, string][];
    onChange: (v: T) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex p-[3px] gap-0.5 rounded-[9px] bg-white/[.04] border border-white/[.08]" role="radiogroup">
            {options.map(([v, label]) => {
                const selected = v === value;
                return (
                    <button
                        key={String(v)}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={disabled}
                        onClick={() => onChange(v)}
                        className={`px-3.5 py-[5px] max-md:py-[7px] rounded-md text-[13px] font-semibold transition-colors disabled:cursor-not-allowed ${
                            selected ? 'bg-[rgba(34,211,238,0.14)] text-[#22d3ee]' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

const Slider: React.FC<{
    value: number; min: number; max: number; step: number;
    format: (v: number) => string;
    onChange: (v: number) => void;
    disabled?: boolean;
    label: string;
}> = ({ value, min, max, step, format, onChange, disabled, label }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const pct = ((value - min) / (max - min)) * 100;

    const setFromPointer = (clientX: number) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return;
        const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const next = Math.round((min + p * (max - min)) / step) * step;
        onChange(Number(next.toFixed(4)));
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, Number((value + step).toFixed(4))));
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, Number((value - step).toFixed(4))));
        else return;
        e.preventDefault();
    };

    return (
        <>
            <div
                ref={trackRef}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={label}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={format(value)}
                aria-disabled={disabled}
                onKeyDown={disabled ? undefined : handleKey}
                onPointerDown={disabled ? undefined : (e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setFromPointer(e.clientX);
                }}
                onPointerMove={disabled ? undefined : (e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromPointer(e.clientX);
                }}
                className={`relative w-[120px] max-md:w-[160px] h-5 max-md:h-7 flex items-center touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 rounded ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="w-full h-1 rounded-sm bg-white/[.12]" />
                <div className="absolute left-0 h-1 rounded-sm bg-[#22d3ee]" style={{ width: `${pct}%` }} />
                <div
                    className="absolute w-3.5 h-3.5 -ml-[7px] rounded-full bg-slate-100 shadow-[0_0_0_3px_rgba(34,211,238,.25)]"
                    style={{ left: `${pct}%` }}
                />
            </div>
            <span className="w-10 text-right font-mono text-xs font-medium text-slate-400">{format(value)}</span>
        </>
    );
};

interface RowProps {
    title: string;
    description: string;
    badge?: string;
    sub?: boolean;
    disabled?: boolean;
    first?: boolean;
    children: React.ReactNode;
}

const Row: React.FC<RowProps> = ({ title, description, badge, sub, disabled, first, children }) => (
    <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-7 py-4 transition-opacity duration-200 ${first ? '' : 'border-t border-white/[.06]'} ${disabled ? 'opacity-40' : ''}`}
    >
        <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${sub ? 'ml-1 pl-4 border-l-2 border-white/[.08]' : ''}`}>
            <span className="flex items-center gap-2 text-[15px] font-semibold text-slate-200">
                {title}
                {badge && (
                    <span className="font-mono text-[9px] font-semibold tracking-[.1em] text-[#fbbf24] px-1.5 py-0.5 rounded bg-[rgba(251,191,36,.1)]">{badge}</span>
                )}
            </span>
            <span className="text-[13px] leading-[1.5] text-slate-400 text-pretty">{description}</span>
        </div>
        <div className={`flex-none flex items-center gap-2.5 ${sub ? 'ml-[22px] sm:ml-0' : ''}`}>{children}</div>
    </div>
);

// --- Popup ---

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

    const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const noConversion = settings.chartFormatConversion === 'none';
    const noAudio = !settings.newUiAudioPreview;

    const renderExport = () => (
        <>
            <Row first title="Chart file extension" description="File extension used for exported charts. Some browsers may override this, causing something like pez.zip.">
                <Segmented value={settings.useZipFormat} options={[[false, 'PEZ'], [true, 'ZIP']]} onChange={v => update('useZipFormat', v)} />
            </Row>
            <Row title="Chart illustration" description="The illustration type bundled into exported charts.">
                <Segmented value={settings.exportIllustrationType} options={[['full', 'Full size'], ['blur', 'Blur']]} onChange={v => update('exportIllustrationType', v)} />
            </Row>
            <Row title="Chart format conversion" description="Convert chart data into other formats to support other editors. Only affects chart bundles, not individual files.">
                <Segmented value={settings.chartFormatConversion} options={[['none', 'None'], ['rpe', 'To RPE']]} onChange={v => update('chartFormatConversion', v)} />
            </Row>
            <Row sub disabled={noConversion} title="Easing fit" description="Rebuild cut events into larger eased ones. Reduces file size; recommended for editing in RPE.">
                <Toggle label="Easing fit" enabled={settings.chartEasingFitting} onChange={v => update('chartEasingFitting', v)} disabled={noConversion} />
            </Row>
        </>
    );

    const renderVisual = () => (
        <>
            <Row first badge="WIP" title="Audio preview" description="Automatically play the selected song's audio.">
                <Toggle label="Audio preview" enabled={settings.newUiAudioPreview} onChange={v => update('newUiAudioPreview', v)} />
            </Row>
            <Row sub disabled={noAudio} title="Volume" description="Volume of the audio player.">
                <Slider label="Volume" value={settings.newUiAudioVolume} min={0} max={1} step={0.05} format={v => `${Math.round(v * 100)}%`} onChange={v => update('newUiAudioVolume', v)} disabled={noAudio} />
            </Row>
            <Row sub disabled={noAudio} title="Loop" description="Loop back to the beginning when the song ends.">
                <Toggle label="Loop" enabled={settings.newUiLoopAudio} onChange={v => update('newUiLoopAudio', v)} disabled={noAudio} />
            </Row>
            <Row title="Blur" description="Blur the content behind popups and glass panels. When off, a black fade is used instead.">
                <Toggle label="Blur" enabled={settings.newUiBlur} onChange={v => update('newUiBlur', v)} />
            </Row>
        </>
    );

    const renderProxy = () => (
        <>
            <div className="pt-4 flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-slate-200">Proxy source</span>
                <span className="text-[13px] leading-[1.5] text-slate-400 text-pretty">
                    Proxies may help with accessing GitHub in restricted regions or avoiding rate limits. Use GitHub official whenever possible.
                </span>
            </div>
            <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Proxy source">
                {PROXY_SOURCES.map(option => {
                    const selected = settings.proxySource === option.id;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => update('proxySource', option.id)}
                            className={`text-left flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] border transition-colors ${
                                selected
                                    ? 'border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.06)]'
                                    : 'border-white/[.07] bg-white/[.015] hover:border-white/[.18]'
                            }`}
                        >
                            <span className={`w-4 h-4 flex-none rounded-full border-[1.5px] flex items-center justify-center ${selected ? 'border-[#22d3ee]' : 'border-slate-600'}`}>
                                <span className={`w-2 h-2 rounded-full ${selected ? 'bg-[#22d3ee]' : ''}`} />
                            </span>
                            <span className="flex-1 min-w-0 flex flex-col">
                                <span className="text-sm font-semibold text-slate-200">{option.label}</span>
                                <span className="text-xs text-slate-400">{option.description}</span>
                            </span>
                            <span className={`font-mono text-[10px] font-medium ${selected ? 'text-[#22d3ee]' : 'text-slate-600'}`}>{PROXY_TAGS[option.id]}</span>
                        </button>
                    );
                })}
            </div>
            <div className="mt-7 pt-5 border-t border-white/[.06] flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-slate-200">GitHub access token</span>
                <span className="text-[13px] leading-[1.5] text-slate-400 text-pretty">
                    Optional personal access token for higher GitHub rate limits. No scopes are needed. It is stored only in this browser and sent only to GitHub when the source is set to GitHub.
                </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
                <input
                    type="password"
                    value={settings.githubToken}
                    onChange={e => update('githubToken', e.target.value.trim())}
                    placeholder="ghp_… or github_pat_…"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="GitHub personal access token"
                    className="flex-1 min-w-0 h-[38px] max-md:h-11 px-3 rounded-lg bg-white/[.04] border border-white/[.08] font-mono text-xs max-md:text-base text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#22d3ee]/50"
                />
                <Button variant="outline" className="py-[7px] max-md:h-11" onClick={() => update('githubToken', '')} disabled={!settings.githubToken}>Clear</Button>
            </div>
        </>
    );

    const renderAdvanced = () => (
        <>
            <Row first title="Advanced info" description="Tooltips with advanced information such as charter names and file URLs.">
                <Toggle label="Advanced info" enabled={settings.advancedInfo} onChange={v => update('advancedInfo', v)} />
            </Row>
            <Row title="Analytics" description="Sends anonymous stats about downloaded charts. When off, only an anonymized ID is sent. Uses a Discord webhook.">
                <Toggle label="Analytics" enabled={settings.analyticsEnabled} onChange={v => update('analyticsEnabled', v)} />
            </Row>
            <Row badge="WIP" title="Bulk download mode" description="Allows bulk export of assets and charts.">
                <Toggle label="Bulk download mode" enabled={settings.bulkDownloadMode} onChange={v => update('bulkDownloadMode', v)} />
            </Row>
        </>
    );

    return (
        <DialogFrame onClose={onClose} labelledBy="settings-title" className="w-full max-w-[820px] h-[min(600px,calc(100dvh-32px))]">
            <DialogHeader id="settings-title" eyebrow="Preferences" title="Settings" onClose={onClose} />

            <div className="flex-1 min-h-0 flex flex-col sm:grid sm:grid-cols-[184px_minmax(0,1fr)]">
                <nav
                    className="flex sm:flex-col gap-0.5 px-3 py-2 sm:py-4 border-b sm:border-b-0 sm:border-r border-white/[.06] overflow-x-auto"
                    role="tablist"
                    aria-label="Settings categories"
                >
                    {CATEGORIES.map(({ id, label }, i) => {
                        const selected = category === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                onClick={() => setCategory(id)}
                                className={`flex-none flex items-center justify-between gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                                    selected ? 'bg-[rgba(34,211,238,0.08)] text-[#22d3ee]' : 'text-slate-400 hover:text-slate-100'
                                }`}
                            >
                                <span>{label}</span>
                                <span className="font-mono text-[10px] font-medium text-slate-600">{String(i + 1).padStart(2, '0')}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-5 sm:px-7 pt-1 pb-5" role="tabpanel">
                    {category === 'export' && renderExport()}
                    {category === 'visual' && renderVisual()}
                    {category === 'proxy' && renderProxy()}
                    {category === 'advanced' && renderAdvanced()}
                </div>
            </div>

            <div className="flex-none min-h-[68px] flex flex-wrap items-center justify-between gap-3 px-6 py-3 max-md:px-5 max-md:pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-white/[.06] bg-white/[.015]">
                {confirmReset ? (
                    <div className="flex items-center gap-2.5">
                        <span className="text-[13px] text-[#fca5a5]">Reset all settings?</span>
                        <Button variant="danger" className="py-[7px]" onClick={() => { setSettings(defaultSettings); setConfirmReset(false); }}>Reset</Button>
                        <Button variant="outline" className="py-[7px]" onClick={() => setConfirmReset(false)}>Cancel</Button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="flex items-center gap-2 text-[13px] font-semibold text-[#f87171] px-3 py-2 -ml-3 rounded-lg hover:bg-[rgba(248,113,113,.08)] transition-colors"
                    >
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Reset defaults
                    </button>
                )}
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline font-mono text-[10px] font-medium tracking-[.1em] text-slate-600">SAVED/APPLIED AUTOMATICALLY</span>
                    <Button variant="primary" size="md" onClick={onClose}>Done</Button>
                </div>
            </div>
        </DialogFrame>
    );
};
