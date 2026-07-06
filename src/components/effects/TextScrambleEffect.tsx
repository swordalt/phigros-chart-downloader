
import React, { useEffect, useRef } from 'react';

interface TextScrambleEffectProps {
    audio?: HTMLAudioElement | null;
    enabled?: boolean;
}

export const TextScrambleEffect: React.FC<TextScrambleEffectProps> = ({ audio, enabled = true }) => {
    const activeGlitches = useRef<Map<Text, string>>(new Map());
    const timeoutIds = useRef<number[]>([]);
    const loopTimeoutId = useRef<number | null>(null);
    const isRunning = useRef(true);

    useEffect(() => {
        if (!enabled) return;
        isRunning.current = true;

        const REPLACEMENT_CHARS = ['█', '□', '☐'];

        const getTextNodes = () => {
             const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
                        // Skip scripts, styles, inputs, etc.
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        const tag = parent.tagName;
                        if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'NOSCRIPT'].includes(tag)) return NodeFilter.FILTER_REJECT;
                        if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
                        
                        // Exclude dialogs (Settings, FAQ, Warnings)
                        if (parent.closest('[role="dialog"]')) return NodeFilter.FILTER_REJECT;
                        
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            const nodes: Text[] = [];
            let n = walker.nextNode();
            while (n) {
                nodes.push(n as Text);
                n = walker.nextNode();
            }
            return nodes;
        };

        const triggerGlitch = () => {
             if (audio && audio.paused) return;

             const nodes = getTextNodes();
             if (nodes.length === 0) return;

             // Glitch 1-5 nodes at a time
             const count = Math.floor(Math.random() * 5) + 1;

             for(let i=0; i<count; i++) {
                 const node = nodes[Math.floor(Math.random() * nodes.length)];
                 if (activeGlitches.current.has(node)) continue;

                 const originalText = node.nodeValue || '';
                 if (originalText.length === 0) continue;

                 activeGlitches.current.set(node, originalText);

                 // Replace random characters
                 let newText = originalText;
                 const charCount = Math.floor(Math.random() * Math.min(5, newText.length)) + 1;
                 
                 // Create a set of indices to replace to avoid replacing same index twice
                 const indicesToReplace = new Set<number>();
                 while(indicesToReplace.size < charCount) {
                     indicesToReplace.add(Math.floor(Math.random() * newText.length));
                 }

                 const chars = newText.split('');
                 indicesToReplace.forEach(idx => {
                     if (chars[idx] !== ' ') {
                        chars[idx] = REPLACEMENT_CHARS[Math.floor(Math.random() * REPLACEMENT_CHARS.length)];
                     }
                 });
                 newText = chars.join('');

                 node.nodeValue = newText;

                 // Revert after random duration (100ms - 500ms)
                 const duration = 100 + Math.random() * 400;
                 const id = window.setTimeout(() => {
                     if (activeGlitches.current.has(node)) {
                         node.nodeValue = activeGlitches.current.get(node) || '';
                         activeGlitches.current.delete(node);
                     }
                 }, duration);
                 timeoutIds.current.push(id);
             }
        };

        const loop = () => {
            if (!isRunning.current) return;
            
            // Random chance to skip a tick for irregularity
            if (Math.random() > 0.3) {
                triggerGlitch();
            }
            
            // Random interval between ticks
            const nextTick = 50 + Math.random() * 150;
            loopTimeoutId.current = window.setTimeout(loop, nextTick);
        };

        loop();

        const currentTimeoutIds = timeoutIds.current;
        const currentActiveGlitches = activeGlitches.current;

        return () => {
            isRunning.current = false;
            if (loopTimeoutId.current) clearTimeout(loopTimeoutId.current);
            currentTimeoutIds.forEach(clearTimeout);
            
            // Restore all
            currentActiveGlitches.forEach((original, node) => {
                node.nodeValue = original;
            });
            currentActiveGlitches.clear();
        };
    }, [audio, enabled]);

    return null;
};
