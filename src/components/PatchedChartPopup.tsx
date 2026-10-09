import React from 'react';
import { Button, NoticeDialog, WrenchGlyph } from './ui/Dialog';
import { getDifficultyColor } from '../utils/difficulty';

interface PatchedChartPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onDownloadOriginal: () => void;
    onDownloadPatched: () => void;
    reason?: string;
    songName?: string;
    difficulty?: string;
}

export const PatchedChartPopup: React.FC<PatchedChartPopupProps> = ({ isOpen, onCancel, onDownloadOriginal, onDownloadPatched, reason, songName, difficulty }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="warning"
            icon={<WrenchGlyph />}
            eyebrow="Patch available"
            title="A fixed version of this chart exists"
            onClose={onCancel}
            actions={
                <>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button variant="outline" onClick={onDownloadOriginal}>Save original</Button>
                    <Button variant="warning" onClick={onDownloadPatched}>Save patched</Button>
                </>
            }
        >
            {reason && <p className="text-[13px] leading-[1.6] text-slate-400 text-pretty">{reason}</p>}
            {songName && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[.03] font-mono text-[11px] font-medium text-slate-500">
                    <span className="text-slate-300 truncate">{songName}</span>
                    {difficulty && (
                        <>
                            <span>·</span>
                            <span style={{ color: getDifficultyColor(difficulty) }}>{difficulty}</span>
                        </>
                    )}
                </div>
            )}
        </NoticeDialog>
    );
};
