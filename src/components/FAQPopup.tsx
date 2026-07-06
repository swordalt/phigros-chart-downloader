
import React, { useRef } from 'react';
import { faqData } from '../faqData';
import { useSettings } from '../contexts/SettingsContext';
import { useVirtualizer } from '@tanstack/react-virtual';

interface FAQPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AccordionItemProps {
    question: string;
    children: string;
    isLast: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, children, isLast }) => (
    <details className={`group border-b border-slate-700/50 py-4 ${isLast ? 'border-none' : ''}`}>
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-200 hover:text-white">
            {question}
            <div className="text-slate-400 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 transition-transform duration-300 group-open:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </div>
        </summary>
        <div className="mt-4 text-slate-400" dangerouslySetInnerHTML={{ __html: children }} />
    </details>
);

export const FAQPopup: React.FC<FAQPopupProps> = ({ isOpen, onClose }) => {
    const { settings } = useSettings();
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: faqData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 100,
    });

    if (!isOpen) return null;

    return (
        <div 
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="faq-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className={`motion-dialog relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl transform transition-all ${
                    settings.useNewUi ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-slate-900'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 id="faq-title" className="text-2xl font-bold text-brand-cyan mb-4">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div 
                    ref={parentRef} 
                    className="max-h-[60vh] overflow-y-auto px-6 custom-scrollbar"
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const item = faqData[virtualItem.index];
                            return (
                                <div
                                    key={virtualItem.key}
                                    ref={rowVirtualizer.measureElement}
                                    data-index={virtualItem.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <AccordionItem 
                                        question={item.question} 
                                        isLast={virtualItem.index === faqData.length - 1}
                                    >
                                        {item.answer}
                                    </AccordionItem>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 text-right bg-slate-900/50 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 font-bold rounded-lg shadow-md transition-colors duration-200 bg-slate-600 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
