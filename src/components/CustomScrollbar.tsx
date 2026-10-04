import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CustomScrollbarProps {
    /** The scrollable element to mirror. Must be mounted by the time this component's effects run. */
    scrollRef: React.RefObject<HTMLElement>;
    /** Changing this value forces a re-measure (e.g. when the list's content changes). */
    watch?: unknown;
}

const MIN_THUMB = 24;

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ scrollRef, watch }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [thumb, setThumb] = useState({ size: 0, offset: 0, visible: false });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ pointerY: 0, scrollTop: 0 });

    const update = useCallback(() => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        const trackHeight = track.clientHeight;
        if (scrollHeight <= clientHeight + 1 || trackHeight === 0) {
            setThumb(t => (t.visible ? { size: 0, offset: 0, visible: false } : t));
            return;
        }
        const size = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackHeight);
        const maxScroll = scrollHeight - clientHeight;
        const offset = (scrollTop / maxScroll) * (trackHeight - size);
        setThumb({ size, offset, visible: true });
    }, [scrollRef]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        update();
        el.addEventListener('scroll', update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(el);
        Array.from(el.children).forEach(child => observer.observe(child));
        return () => {
            el.removeEventListener('scroll', update);
            observer.disconnect();
        };
    }, [scrollRef, update, watch]);

    const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStart.current = { pointerY: e.clientY, scrollTop: el.scrollTop };
        setDragging(true);
    };

    const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!dragging || !el || !track) return;
        const scrollable = el.scrollHeight - el.clientHeight;
        const travel = track.clientHeight - thumb.size;
        if (travel <= 0) return;
        el.scrollTop = dragStart.current.scrollTop + ((e.clientY - dragStart.current.pointerY) / travel) * scrollable;
    };

    const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDragging(false);
    };

    const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = scrollRef.current;
        const track = trackRef.current;
        if (!el || !track) return;
        const rect = track.getBoundingClientRect();
        const ratio = (e.clientY - rect.top - thumb.size / 2) / (rect.height - thumb.size);
        el.scrollTop = Math.min(1, Math.max(0, ratio)) * (el.scrollHeight - el.clientHeight);
    };

    return (
        <div
            ref={trackRef}
            aria-hidden="true"
            onPointerDown={handleTrackPointerDown}
            className={`absolute top-1.5 bottom-1.5 right-1 w-2 rounded-full bg-slate-900/40 transition-opacity duration-200 ${
                thumb.visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            <div
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
                onPointerUp={handleThumbPointerUp}
                onPointerCancel={handleThumbPointerUp}
                style={{ height: thumb.size, transform: `translateY(${thumb.offset}px)` }}
                className={`w-full rounded-full cursor-pointer touch-none transition-colors duration-150 ${
                    dragging ? 'bg-brand-cyan' : 'bg-slate-500 hover:bg-brand-cyan/70'
                }`}
            />
        </div>
    );
};
