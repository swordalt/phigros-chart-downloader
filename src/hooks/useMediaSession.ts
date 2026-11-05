import { useEffect } from 'react';
import { Song } from '../types';

const ARTWORK_SIZE = 512;
const SEEK_STEP = 10;

// OS media controls show artwork as a square, so the wide illustration is center-cropped
// into a square jacket. Falls back to the original image if the canvas can't be read.
const cropToSquare = (url: string): Promise<string> => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        try {
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = Math.min(side, ARTWORK_SIZE);
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(url);
            ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : url), 'image/png');
        } catch {
            resolve(url);
        }
    };
    img.onerror = () => resolve(url);
    img.src = url;
});

// Shows the playing song (name, composer, jacket) in browser/OS media controls instead of the page title and favicon.
export const useMediaSession = (audio: HTMLAudioElement | null, song: Song | null, artworkUrl: string | null) => {
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;
        if (!audio || !song) {
            navigator.mediaSession.metadata = null;
            return;
        }

        const base = { title: song.name, artist: song.composer, album: 'Phigros' };
        navigator.mediaSession.metadata = new MediaMetadata(base);
        if (!artworkUrl) return;

        let cancelled = false;
        let objectUrl: string | null = null;
        cropToSquare(artworkUrl).then(src => {
            if (src.startsWith('blob:')) objectUrl = src;
            if (cancelled) {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                return;
            }
            navigator.mediaSession.metadata = new MediaMetadata({
                ...base,
                artwork: [{ src, sizes: src === artworkUrl ? undefined : `${ARTWORK_SIZE}x${ARTWORK_SIZE}`, type: 'image/png' }],
            });
        });

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [audio, song, artworkUrl]);

    useEffect(() => {
        if (!('mediaSession' in navigator) || !audio) return;
        const session = navigator.mediaSession;

        const updatePosition = () => {
            if (!Number.isFinite(audio.duration)) return;
            try {
                session.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate,
                    position: Math.min(audio.currentTime, audio.duration),
                });
            } catch {
                // Some browsers reject position updates mid-load; the next event retries.
            }
        };
        const updateState = () => {
            session.playbackState = audio.paused ? 'paused' : 'playing';
            updatePosition();
        };
        const seekTo = (time: number) => {
            audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
            updatePosition();
        };

        const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => { audio.play().catch(err => console.warn('Could not play audio:', err)); }],
            ['pause', () => audio.pause()],
            ['stop', () => { audio.pause(); audio.currentTime = 0; }],
            ['seekbackward', d => seekTo(audio.currentTime - (d.seekOffset ?? SEEK_STEP))],
            ['seekforward', d => seekTo(audio.currentTime + (d.seekOffset ?? SEEK_STEP))],
            ['seekto', d => { if (d.seekTime !== undefined) seekTo(d.seekTime); }],
        ];
        for (const [action, handler] of handlers) {
            try {
                session.setActionHandler(action, handler);
            } catch {
                // Action not supported by this browser.
            }
        }

        const events = ['play', 'pause', 'ended', 'loadedmetadata', 'seeked', 'ratechange'];
        events.forEach(e => audio.addEventListener(e, updateState));
        updateState();

        return () => {
            events.forEach(e => audio.removeEventListener(e, updateState));
            for (const [action] of handlers) {
                try {
                    session.setActionHandler(action, null);
                } catch {
                    // Ignore unsupported actions.
                }
            }
            session.playbackState = 'none';
        };
    }, [audio]);
};
