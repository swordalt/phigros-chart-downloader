
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './Icons';
import { Song } from '../types';

interface DifficultySelectorProps {
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
    selectedSong: Song | null;
    highlight?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ difficulties, selectedDifficulty, onSelectDifficulty, selectedSong, highlight }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    if (difficulties.length === 0) {
        return null;
    }

    const handleSelect = (difficulty: string) => {
        onSelectDifficulty(difficulty);
        setIsOpen(false);
    };

    const getDifficultyLabel = (diff: string) => {
        if (!selectedSong || !selectedSong.difficulties) return diff;
        const constant = selectedSong.difficulties[diff as keyof typeof selectedSong.difficulties];
        return constant ? `${diff} (${constant})` : diff;
    };

    return (
        <div ref={wrapperRef} className="relative w-48">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-full px-4 py-2 text-left rounded-lg border bg-slate-800/70 shadow-md backdrop-blur-sm hover:bg-slate-700/80 transition-all duration-200 ${
                    highlight 
                        ? 'border-red-500 ring-2 ring-red-500/50 animate-shake' 
                        : 'border-slate-600'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className={`font-bold ${selectedDifficulty ? 'text-slate-100' : 'text-slate-400'}`}>
                    {selectedDifficulty ? getDifficultyLabel(selectedDifficulty) : 'Difficulty'}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="motion-dropdown-up absolute z-40 w-full bottom-full mb-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-2xl"
                >
                    <ul className="max-h-60 overflow-y-auto" role="listbox">
                        {difficulties.map(diff => (
                            <li
                                key={diff}
                                className="px-4 py-2 cursor-pointer font-medium text-slate-300 hover:bg-brand-cyan/20 hover:text-white transition-colors duration-150"
                                onClick={() => handleSelect(diff)}
                                role="option"
                                aria-selected={selectedDifficulty === diff}
                            >
                                {getDifficultyLabel(diff)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
