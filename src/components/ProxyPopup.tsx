
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { PROXY_SOURCES, ProxySource } from '../utils/resourceUrls';

interface ProxyPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProxyPopup: React.FC<ProxyPopupProps> = ({ isOpen, onClose }) => {
    const { settings, setSettings } = useSettings();

    if (!isOpen) return null;

    const handleSelect = (id: ProxySource) => {
        setSettings(prev => ({ ...prev, proxySource: id }));
    };

    return (
        <div
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="proxy-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`motion-dialog relative w-full max-w-md mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl p-6 text-left transform transition-all ${
                    settings.useNewUi ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-slate-900'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="proxy-title" className="text-2xl font-bold text-brand-cyan mb-2">
                    Proxy
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                    Proxies may help with accessing GitHub in restricted regions or avoiding rate limits. Use GitHub official whenever possible.
                </p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {PROXY_SOURCES.map((option) => {
                        const isSelected = settings.proxySource === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(option.id)}
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

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
