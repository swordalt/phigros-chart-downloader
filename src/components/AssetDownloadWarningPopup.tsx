import React from 'react';
import { Button, InfoGlyph, NoticeDialog } from './ui/Dialog';

interface AssetDownloadWarningPopupProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const AssetDownloadWarningPopup: React.FC<AssetDownloadWarningPopupProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="info"
            icon={<InfoGlyph />}
            eyebrow="Raw file"
            title="This is a chart .json, not a playable chart"
            onClose={onCancel}
            footnote="Shown once"
            actions={
                <>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={onConfirm}>Download .json</Button>
                </>
            }
        >
            <p className="text-[13px] leading-[1.6] text-slate-400 text-pretty">
                It can&apos;t be imported into Phira or RPE on its own. To get a playable file, pick a difficulty and use{' '}
                <b className="text-[#22d3ee] font-semibold">Export for Phira &amp; RPE</b>.
            </p>
        </NoticeDialog>
    );
};
