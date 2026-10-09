import React from 'react';
import { Button, InfoGlyph, NoticeDialog } from './ui/Dialog';

interface InstructionPopupProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const InstructionPopup: React.FC<InstructionPopupProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="info"
            icon={<InfoGlyph />}
            eyebrow="After downloading"
            title="How to use this file"
            onClose={onCancel}
            footnote="Shown once"
            actions={<Button variant="primary" onClick={onConfirm}>Continue to download</Button>}
        >
            <div className="flex flex-col gap-2 max-md:gap-2.5">
                <div className="grid grid-cols-[22px_1fr] max-md:grid-cols-[24px_1fr] gap-2 text-[13px] max-md:text-sm leading-[1.5] text-slate-300">
                    <span className="font-mono text-[11px] leading-[1.8] font-medium text-[#22d3ee]">01</span>
                    <span>Import it into <b className="text-white">Phira</b> via the + button.</span>
                </div>
                <div className="grid grid-cols-[22px_1fr] max-md:grid-cols-[24px_1fr] gap-2 text-[13px] max-md:text-sm leading-[1.5] text-slate-300">
                    <span className="font-mono text-[11px] leading-[1.8] font-medium text-[#22d3ee]">02</span>
                    <span>Or edit it in <b className="text-white">Re:PhiEdit</b> via “Import PEZ”.</span>
                </div>
            </div>
        </NoticeDialog>
    );
};
