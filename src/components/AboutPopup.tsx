
import React, { useRef, useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { projectDescription, updateLogs } from '../aboutData';
import { useVirtualizer } from '@tanstack/react-virtual';

interface AboutPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isLast: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isLast }) => (
    <details className={`group border-b border-slate-700/50 py-4 ${isLast ? 'border-none' : ''}`}>
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-slate-200 hover:text-white transition-colors">
            {title}
            <div className="text-slate-400 group-hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 transition-transform duration-300 group-open:rotate-180">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </div>
        </summary>
        <div className="mt-4 text-slate-400 text-sm">
            {children}
        </div>
    </details>
);

export const AboutPopup: React.FC<AboutPopupProps> = ({ isOpen, onClose }) => {
    const { settings } = useSettings();
    const parentRef = useRef<HTMLDivElement>(null);

    const latestLog = updateLogs[0];
    const pastLogs = updateLogs.slice(1);

    // Flatten the content into a list for virtualization
    const items = useMemo(() => {
        const list: { type: 'header' | 'latest' | 'history-title' | 'log', data?: any }[] = [
            { type: 'header' },
            { type: 'latest', data: latestLog },
        ];
        
        if (pastLogs.length > 0) {
            list.push({ type: 'history-title' });
            pastLogs.forEach(log => {
                list.push({ type: 'log', data: log });
            });
        }
        return list;
    }, [latestLog, pastLogs]);

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => {
            switch (items[index].type) {
                case 'header': return 200;
                case 'latest': return 150;
                case 'history-title': return 40;
                case 'log': return 80;
                default: return 50;
            }
        },
    });

    if (!isOpen) return null;

    return (
        <div 
            className="motion-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            aria-labelledby="about-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div 
                className={`motion-dialog relative w-full max-w-2xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl transform transition-all flex flex-col max-h-[80vh] ${
                    settings.useNewUi ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-slate-900'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Combined Scrollable Container */}
                <div 
                    ref={parentRef}
                    className="flex-1 overflow-y-auto custom-scrollbar"
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const item = items[virtualItem.index];
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
                                    {item.type === 'header' && (
                                        <div className="p-6 border-b border-slate-700/50">
                                            <h2 id="about-title" className="text-2xl font-bold text-brand-cyan mb-2">
                                                About Project
                                            </h2>
                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                {projectDescription}
                                            </p>
                                        </div>
                                    )}

                                    {item.type === 'latest' && item.data && (
                                        <div className="px-6 pt-6 pb-2">
                                            <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-2 py-1 rounded bg-brand-cyan/20 text-brand-cyan text-xs font-bold uppercase tracking-wider">Latest Update</span>
                                                    <h3 className="font-bold text-white text-lg">{item.data.date}</h3>
                                                </div>
                                                <div 
                                                    className="bg-slate-800/50 rounded-lg p-4 text-slate-300 text-sm border border-slate-700/50"
                                                    dangerouslySetInnerHTML={{ __html: item.data.content }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {item.type === 'history-title' && (
                                        <div className="px-6 pt-2 pb-2">
                                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Version History</h3>
                                        </div>
                                    )}

                                    {item.type === 'log' && item.data && (
                                        <div className="px-6">
                                            <AccordionItem 
                                                title={item.data.date}
                                                isLast={virtualItem.index === items.length - 1}
                                            >
                                                <div dangerouslySetInnerHTML={{ __html: item.data.content }} />
                                            </AccordionItem>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 text-right bg-slate-900/50 border-t border-slate-800 shrink-0">
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
