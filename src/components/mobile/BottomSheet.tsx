import React, { useEffect } from 'react';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    labelledBy?: string;
    children: React.ReactNode;
}

/**
 * Sheet that slides up from the bottom edge over a dimmed backdrop. It stays mounted while closed so it
 * can animate out; callers keep rendering the last content until the slide-out finishes.
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, labelledBy, children }) => {
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    return (
        <>
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-[rgba(4,6,10,.72)] backdrop-blur-[4px] transition-opacity duration-[220ms] ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-hidden={!open}
                aria-labelledby={labelledBy}
                className={`fixed left-0 right-0 bottom-0 z-40 max-h-[86dvh] flex flex-col rounded-t-[22px] border border-b-0 border-white/[.08] bg-[rgba(12,15,22,.98)] shadow-[0_-30px_80px_rgba(0,0,0,.5)] overflow-hidden transition-[transform,visibility] duration-[320ms] ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'translate-y-0 visible' : 'translate-y-[105%] invisible'}`}
            >
                <div className="dialog-topline" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.5), transparent)' }} />
                <button type="button" onClick={onClose} aria-label="Close" className="flex-none h-[22px] flex items-center justify-center">
                    <span className="w-9 h-1 rounded-sm bg-white/[.18]" />
                </button>
                <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-1 pb-[calc(24px+env(safe-area-inset-bottom))]">
                    {children}
                </div>
            </div>
        </>
    );
};
