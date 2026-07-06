
import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface BlacklistWarningPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    reason?: string;
}

export const BlacklistWarningPopup: React.FC<BlacklistWarningPopupProps> = ({ isOpen, onCancel, onConfirm, reason }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="warning-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="motion-dialog relative w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-yellow-500/50 bg-slate-900 shadow-2xl p-6 text-left transform transition-all">
                <div className="flex items-start gap-4">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <h2 id="warning-title" className="text-2xl font-bold text-yellow-400 mb-2">
                            Notice
                        </h2>
                        <div className="text-slate-300 space-y-3">
                            <p>
                                This chart may have some issues. More information is available below:
                            </p>
                            {reason && <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg"><b>Reason:</b> {reason}</p>}
                            <p className="mt-4 font-semibold">
                                Would you like to proceed with the download?
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
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-yellow-600 hover:bg-yellow-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-yellow-500"
                    >
                        Proceed Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};
