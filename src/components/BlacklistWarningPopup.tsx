import React from 'react';
import { Button, NoticeDialog, WarningGlyph } from './ui/Dialog';

interface BlacklistWarningPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    reason?: string;
}

export const BlacklistWarningPopup: React.FC<BlacklistWarningPopupProps> = ({ isOpen, onCancel, onConfirm, reason }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="warning"
            icon={<WarningGlyph />}
            eyebrow="Known issue"
            title="This chart may not work correctly"
            onClose={onCancel}
            actions={
                <>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button variant="warning" onClick={onConfirm}>Proceed anyway</Button>
                </>
            }
        >
            {reason && (
                <div className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-[rgba(251,191,36,.05)] border border-[rgba(251,191,36,.15)]">
                    <span className="font-mono text-[10px] font-medium tracking-[.12em] text-[#a16207]">REASON</span>
                    <span className="text-[13px] leading-[1.55] text-slate-200">{reason}</span>
                </div>
            )}
            <p className="text-[13px] text-slate-400">Proceed with the download anyway?</p>
        </NoticeDialog>
    );
};
