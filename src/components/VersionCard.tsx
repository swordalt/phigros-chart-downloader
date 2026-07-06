
import React, { memo } from 'react';
import { Spinner } from './Spinner';
import { ErrorIcon, TagIcon } from './Icons';

interface VersionCardProps {
    isLoading: boolean;
    error: string | null;
    version: string | null;
}

export const VersionCard: React.FC<VersionCardProps> = memo(({ isLoading, error, version }) => {
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center gap-3 text-slate-400 min-h-[4rem]">
                    <Spinner />
                    <span>Fetching version...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center gap-2 text-red-400">
                    <ErrorIcon className="w-8 h-8" />
                    <span className="font-semibold">Failed to load version.</span>
                    <p className="text-xs text-red-500 text-center max-w-[200px] break-words">{error}</p>
                </div>
            );
        }

        if (version) {
            return (
                <>
                    <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-brand-cyan" />
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Contains assets from:
                        </h2>
                    </div>
                    <p className="text-3xl font-bold text-slate-100 tracking-tight">
                        {version}
                    </p>
                </>
            );
        }

        return null;
    };

    return (
        <div className="relative w-full max-w-xs mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center shadow-lg backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-2">
                {renderContent()}
            </div>
        </div>
    );
});
