
import React from 'react';
import { useResourceError } from '../contexts/ResourceErrorContext';
import { ErrorIcon } from './Icons';

interface ResourceErrorPopupProps {
    onSwitchProxy: () => void;
}

export const ResourceErrorPopup: React.FC<ResourceErrorPopupProps> = ({ onSwitchProxy }) => {
    const { resourceError, clearResourceError } = useResourceError();

    if (!resourceError) return null;

    const handleRetry = () => {
        const { onRetry } = resourceError;
        clearResourceError();
        onRetry?.();
    };

    const handleSwitchProxy = () => {
        clearResourceError();
        onSwitchProxy();
    };

    return (
        <div
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="resource-error-title"
            role="alertdialog"
            aria-modal="true"
            onClick={clearResourceError}
        >
            <div
                className="motion-dialog relative w-full max-w-lg mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-6 text-left transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <ErrorIcon className="w-8 h-8 text-red-400 mt-1 flex-shrink-0" />
                    <div>
                        <h2 id="resource-error-title" className="text-2xl font-bold text-red-400 mb-2">
                            Resource Failed to Load
                        </h2>
                        <div className="text-slate-300 space-y-3">
                            <p>{resourceError.message}</p>
                            {resourceError.detail && (
                                <p className="text-xs text-slate-500 break-words">{resourceError.detail}</p>
                            )}
                            <p className="text-sm text-slate-400">
                                This is usually caused by GitHub being unreachable in your region, or the current proxy being down. Try switching to a different proxy, or retry the request.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        onClick={clearResourceError}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Dismiss
                    </button>
                    {resourceError.onRetry && (
                        <button
                            onClick={handleRetry}
                            className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-indigo-700 hover:bg-indigo-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                        >
                            Retry
                        </button>
                    )}
                    <button
                        onClick={handleSwitchProxy}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-brand-cyan hover:bg-cyan-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-cyan"
                    >
                        Switch Proxy
                    </button>
                </div>
            </div>
        </div>
    );
};
