
import React from 'react';
import { InformationCircleIcon } from './Icons';

interface AssetDownloadWarningPopupProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const AssetDownloadWarningPopup: React.FC<AssetDownloadWarningPopupProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="asset-warning-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="motion-dialog relative w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-left transform transition-all">
                <div className="flex items-start gap-4">
                    <InformationCircleIcon className="w-8 h-8 text-brand-cyan mt-1 flex-shrink-0" />
                    <div>
                        <h2 id="asset-warning-title" className="text-2xl font-bold text-brand-cyan mb-2">
                            Notice
                        </h2>
                        <div className="text-slate-300 space-y-3">
                            <p>
                                You are downloading a chart .json file.
                            </p>
                            <p>
                                This file can't be imported into Phira/RPE by itself. If that is what you desire, select a difficulty from the dropdown and click 'Export as Chart'.
                            </p>
                            <p className="mt-4 text-sm text-slate-400">
                                This message will only be shown once.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-purple-800 hover:bg-purple-900 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500"
                    >
                        Download Asset
                    </button>
                </div>
            </div>
        </div>
    );
};
