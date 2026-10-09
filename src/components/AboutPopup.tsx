import React, { useMemo, useState } from 'react';
import { projectDescription, updateLogs } from '../aboutData';
import { DialogFrame, DialogFooter, Eyebrow, CloseButton, Button } from './ui/Dialog';
import { ChevronDownIcon } from './Icons';

interface AboutPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const REPO_URL = 'https://github.com/swordalt/phigros-chart-downloader/';

// Update logs are stored as HTML lists; pull out the text of each <li>.
const parseLogItems = (html: string): string[] => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('li'))
        .map(li => (li.textContent || '').trim())
        .filter(Boolean);
};

export const AboutPopup: React.FC<AboutPopupProps> = ({ isOpen, onClose }) => {
    // Index into the version history; the most recent past entry starts open.
    const [openIndex, setOpenIndex] = useState<number>(0);

    const logs = useMemo(() => updateLogs.map(log => ({ date: log.date, items: parseLogItems(log.content) })), []);
    const latest = logs[0];
    const history = logs.slice(1);

    if (!isOpen) return null;

    return (
        <DialogFrame onClose={onClose} labelledBy="about-title" className="w-full max-w-[680px] max-h-[min(660px,calc(100dvh-32px))]">
            <div className="flex-none flex items-start justify-between gap-6 max-md:gap-4 px-6 max-md:px-5 pt-[22px] pb-5 border-b border-white/[.06]">
                <div className="flex flex-col gap-2">
                    <Eyebrow>About the Project</Eyebrow>
                    <h2 id="about-title" className="text-[21px] font-semibold leading-[1.25] text-slate-100">Phigros Chart Downloader</h2>
                    <p className="text-sm leading-[1.6] text-slate-400 text-pretty">{projectDescription}</p>
                </div>
                <CloseButton onClick={onClose} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-6 max-md:px-5 py-5 flex flex-col gap-5">
                {latest && (
                    <div className="rounded-xl border border-[rgba(34,211,238,.22)] bg-[rgba(34,211,238,.04)] px-[18px] py-4 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#06141a] bg-[#22d3ee] px-[7px] py-[3px] rounded">LATEST</span>
                            <span className="font-mono text-[13px] font-medium text-slate-200">{latest.date}</span>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                            {latest.items.map(item => (
                                <li key={item} className="flex gap-2.5 text-sm leading-[1.5] text-slate-300">
                                    <span className="text-[#22d3ee]">—</span><span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-medium tracking-[.14em] text-slate-500 pb-2">VERSION HISTORY</span>
                        {history.map((log, i) => {
                            const isOpenItem = openIndex === i;
                            return (
                                <div key={log.date} className="border-t border-white/[.06]">
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpenItem ? -1 : i)}
                                        aria-expanded={isOpenItem}
                                        className="w-full h-[46px] flex items-center justify-between group"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={`font-mono text-[13px] font-medium ${isOpenItem ? 'text-slate-100' : 'text-slate-300 group-hover:text-white'}`}>{log.date}</span>
                                            <span className="text-xs text-slate-600">{log.items.length} {log.items.length === 1 ? 'change' : 'changes'}</span>
                                        </span>
                                        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpenItem ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpenItem && (
                                        <ul className="pb-3.5 flex flex-col gap-1.5">
                                            {log.items.map(item => (
                                                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.5] text-slate-400">
                                                    <span className="text-slate-600">—</span><span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DialogFooter>
                <span className="text-[13px] text-slate-500">
                    More information available on <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">GitHub</a>.
                </span>
                <Button variant="outline" size="md" onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogFrame>
    );
};
