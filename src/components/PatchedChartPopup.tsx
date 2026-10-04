
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface PatchedChartPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onDownloadOriginal: () => void;
    onDownloadPatched: () => void;
    reason?: string;
}

export const PatchedChartPopup: React.FC<PatchedChartPopupProps> = ({ isOpen, onCancel, onDownloadOriginal, onDownloadPatched, reason }) => {
    if (!isOpen) return null;

    return (
        <div
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="patched-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="motion-dialog relative w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-yellow-500/50 bg-slate-900 shadow-2xl p-6 text-left transform transition-all">
                <div className="flex items-start gap-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <h2 id="patched-title" className="text-2xl font-bold text-yellow-400 mb-2">
                            Patched Chart Available
                        </h2>
                        <div className="text-slate-300 space-y-3">
                            {reason && <p>{reason}</p>}
                            <p className="mt-4 font-semibold">
                                Would you rather download the patched version?
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDownloadOriginal}
                        className="px-5 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-700 hover:bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Save Original
                    </button>
                    <button
                        onClick={onDownloadPatched}
                        className="px-5 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-yellow-500"
                    >
                        Save Patched
                    </button>
                </div>
            </div>
        </div>
    );
};
