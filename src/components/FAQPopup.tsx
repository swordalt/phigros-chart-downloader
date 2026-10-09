import React, { useState } from 'react';
import { faqData } from '../faqData';
import { DialogFrame, DialogFooter, DialogHeader, Button } from './ui/Dialog';
import { ChevronDownIcon } from './Icons';

interface FAQPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const REPO_ISSUES_URL = 'https://github.com/swordalt/phigros-chart-downloader/issues';

export const FAQPopup: React.FC<FAQPopupProps> = ({ isOpen, onClose }) => {
    // One question open at a time; the first starts open.
    const [openIndex, setOpenIndex] = useState<number>(0);

    if (!isOpen) return null;

    return (
        <DialogFrame onClose={onClose} labelledBy="faq-title" className="w-full max-w-[680px] max-h-[calc(100dvh-32px)]">
            <DialogHeader id="faq-title" eyebrow="Help" title="Frequently asked questions" onClose={onClose} />

            <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-6 max-md:px-5 pt-2 pb-3 flex flex-col">
                {faqData.map((item, i) => {
                    const isOpenItem = openIndex === i;
                    return (
                        <div key={item.question} className={i ? 'border-t border-white/[.06]' : ''}>
                            <button
                                type="button"
                                onClick={() => setOpenIndex(isOpenItem ? -1 : i)}
                                aria-expanded={isOpenItem}
                                className="w-full text-left grid grid-cols-[32px_minmax(0,1fr)_16px] items-center gap-2 py-[15px]"
                            >
                                <span className={`font-mono text-[11px] font-medium ${isOpenItem ? 'text-[#22d3ee]' : 'text-slate-600'}`}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <span className={`text-[15px] font-medium ${isOpenItem ? 'text-slate-100' : 'text-slate-300 hover:text-slate-100'}`}>
                                    {item.question}
                                </span>
                                <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpenItem ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpenItem && (
                                <div className="pl-10 pr-6 max-md:pr-2 pb-4 text-sm leading-[1.65] text-slate-400 text-pretty">
                                    {item.answer}
                                    {item.link && (
                                        <>
                                            {' '}
                                            <a href={item.link.url} target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">{item.link.text}</a>.
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <DialogFooter>
                <span className="text-[13px] text-slate-500">
                    Still stuck? Open an issue on{' '}
                    <a href={REPO_ISSUES_URL} target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#67e8f9]">GitHub</a>
                </span>
                <Button variant="outline" size="md" onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogFrame>
    );
};
