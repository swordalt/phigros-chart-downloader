
import React, { useEffect, useRef, useState } from 'react';
import { resourceFetch } from '../utils/githubAuth';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';

type WebkitAudioWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};

interface AudioPlayerControlProps {
    audio: HTMLAudioElement;
    /** Full-width pill with larger touch targets, used by the phone layout. */
    variant?: 'default' | 'mobile';
}

const isIosBrowser = () => {
    if (typeof window === 'undefined') return false;

    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;

    return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
};

const getLastRangeEnd = (ranges: TimeRanges) => {
    if (ranges.length === 0) return 0;

    return ranges.end(ranges.length - 1);
};

const isValidDuration = (duration: number | undefined) => (
    typeof duration === 'number' && Number.isFinite(duration) && duration > 0
);

const decodeAudioDuration = async (src: string, signal: AbortSignal) => {
    const response = await resourceFetch(src, { cache: 'force-cache', signal });
    if (!response.ok) {
        throw new Error(`Audio duration probe failed with ${response.status}`);
    }

    const encodedAudio = await response.arrayBuffer();
    if (signal.aborted) return null;

    const AudioContextConstructor = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();

    try {
        const decodedAudio = await new Promise<AudioBuffer>((resolve, reject) => {
            const decodeResult = context.decodeAudioData(encodedAudio.slice(0), resolve, reject);
            if (decodeResult) {
                decodeResult.then(resolve, reject);
            }
        });

        return decodedAudio.duration;
    } finally {
        void context.close().catch(() => undefined);
    }
};

export const AudioPlayerControl: React.FC<AudioPlayerControlProps> = ({ audio, variant = 'default' }) => {
    const mobile = variant === 'mobile';
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [decodedDuration, setDecodedDuration] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPlaying, setIsPlaying] = useState(!audio.paused);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const seekBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDecodedDuration(null);
        setIsFullyLoaded(false);

        if (!isIosBrowser() || !audio.src) return;

        const abortController = new AbortController();

        decodeAudioDuration(audio.src, abortController.signal)
            .then(decoded => {
                if (abortController.signal.aborted || !isValidDuration(decoded ?? undefined)) return;

                setDecodedDuration(decoded);
                setDuration(decoded);
                setIsFullyLoaded(true);
            })
            .catch(error => {
                if (!abortController.signal.aborted) {
                    console.warn("Could not decode audio duration:", error);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [audio]);

    useEffect(() => {
        const getNormalizedDuration = () => {
            if (isValidDuration(decodedDuration ?? undefined)) {
                return decodedDuration!;
            }

            const reportedDuration = audio.duration;
            const seekableEnd = getLastRangeEnd(audio.seekable);

            if (isValidDuration(reportedDuration)) {
                if (isValidDuration(seekableEnd) && reportedDuration - seekableEnd > 0.5) {
                    return seekableEnd;
                }

                return reportedDuration;
            }

            return isValidDuration(seekableEnd) ? seekableEnd : 0;
        };

        const updateTime = () => {
            if (!isDragging) setCurrentTime(audio.currentTime);
        };
        const updateDuration = () => {
            const d = getNormalizedDuration();

            if (isValidDuration(d)) {
                setDuration(d);
            }
        };

        const checkBuffered = () => {
            const normalizedDuration = getNormalizedDuration();
            const bufferedEnd = getLastRangeEnd(audio.buffered);
            const seekableEnd = getLastRangeEnd(audio.seekable);

            if (isValidDuration(normalizedDuration)) {
                if (
                    isValidDuration(decodedDuration ?? undefined)
                    || bufferedEnd >= normalizedDuration - 0.5
                    || seekableEnd >= normalizedDuration - 0.5
                ) {
                    setIsFullyLoaded(true);
                }
            }
        };

        const updateVolume = () => {
            setIsMuted(audio.muted);
        };
        const updatePlayState = () => {
            setIsPlaying(!audio.paused);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            if (isValidDuration(audio.currentTime) && audio.currentTime < getNormalizedDuration() - 0.5) {
                setDuration(audio.currentTime);
                setCurrentTime(audio.currentTime);
            }
        };
        
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('loadeddata', updateDuration);
        audio.addEventListener('canplaythrough', checkBuffered);
        audio.addEventListener('progress', updateDuration);
        audio.addEventListener('progress', checkBuffered);
        audio.addEventListener('suspend', updateDuration);
        audio.addEventListener('volumechange', updateVolume);
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);
        
        // Initial check
        updateDuration();
        checkBuffered();
        setCurrentTime(audio.currentTime || 0);
        setIsMuted(audio.muted);
        setIsPlaying(!audio.paused);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('loadeddata', updateDuration);
            audio.removeEventListener('canplaythrough', checkBuffered);
            audio.removeEventListener('progress', updateDuration);
            audio.removeEventListener('progress', checkBuffered);
            audio.removeEventListener('suspend', updateDuration);
            audio.removeEventListener('volumechange', updateVolume);
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audio, decodedDuration, isDragging]);

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const canSeek = duration > 0 && isFullyLoaded;
    const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

    const seekToPointer = (clientX: number) => {
        const rect = seekBarRef.current?.getBoundingClientRect();
        if (!rect || !canSeek) return;
        const time = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
        setCurrentTime(time);
        audio.currentTime = time;
    };

    const handleSeekEnd = () => {
        setIsDragging(false);
        // Resume playback if it was paused (e.g. ended) and we seeked to a valid position
        if (audio.paused && duration > 0 && audio.currentTime < duration) {
            audio.play().catch(err => console.warn("Could not resume playback:", err));
        }
    };

    const handleSeekKey = (e: React.KeyboardEvent) => {
        if (!canSeek) return;
        const delta = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
        if (!delta) return;
        e.preventDefault();
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
    };

    const toggleMute = () => {
        const newMuted = !audio.muted;
        audio.muted = newMuted;
        setIsMuted(newMuted);
    };

    const togglePlay = () => {
        if (audio.paused) {
            audio.play().catch(err => console.warn("Could not play audio:", err));
        } else {
            audio.pause();
        }
    };

    return (
        <div className={`flex items-center gap-3 rounded-full bg-[rgba(9,11,16,.6)] backdrop-blur-md border border-white/[.08] ${mobile ? 'w-full p-1.5' : 'flex-none py-2 pl-2 pr-3.5'}`}>
            <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className={`${mobile ? 'w-10 h-10' : 'w-8 h-8'} flex-none rounded-full bg-[#22d3ee] hover:bg-[#67e8f9] flex items-center justify-center transition-colors`}
            >
                {isPlaying ? (
                    <svg width={mobile ? 18 : 16} height={mobile ? 18 : 16} fill="#090b10" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                    <svg width={mobile ? 18 : 16} height={mobile ? 18 : 16} fill="#090b10" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
            </button>

            <div
                ref={seekBarRef}
                role="slider"
                tabIndex={canSeek ? 0 : -1}
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(currentTime)}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                aria-disabled={!canSeek}
                title={canSeek ? undefined : 'Loading audio…'}
                onKeyDown={handleSeekKey}
                onPointerDown={(e) => {
                    if (!canSeek) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setIsDragging(true);
                    seekToPointer(e.clientX);
                }}
                onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) seekToPointer(e.clientX);
                }}
                onPointerUp={handleSeekEnd}
                onPointerCancel={() => setIsDragging(false)}
                className={`group relative ${mobile ? 'flex-1 min-w-0 h-8' : 'w-20 sm:w-[140px] h-4'} flex items-center touch-none focus:outline-none ${canSeek ? 'cursor-pointer' : 'cursor-progress'}`}
            >
                <div className="w-full h-[3px] rounded-sm bg-white/[.12] overflow-hidden">
                    <div className={`h-full rounded-sm bg-[#22d3ee] ${canSeek ? '' : 'opacity-50'}`} style={{ width: `${progress * 100}%` }} />
                </div>
                {canSeek && (
                    <div
                        className={mobile
                            ? 'absolute w-3 h-3 -ml-1.5 rounded-full bg-slate-100'
                            : 'absolute w-2.5 h-2.5 -ml-[5px] rounded-full bg-slate-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity'}
                        style={{ left: `${progress * 100}%` }}
                    />
                )}
            </div>

            <span className="flex-none font-mono text-[11px] font-medium text-slate-400 tabular-nums whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className={mobile
                    ? 'w-10 h-10 flex-none rounded-full flex items-center justify-center text-slate-400'
                    : 'hidden sm:block text-slate-500 hover:text-slate-200 transition-colors'}
            >
                {isMuted ? <SpeakerXMarkIcon className={mobile ? 'w-[18px] h-[18px]' : 'w-4 h-4'} /> : <SpeakerWaveIcon className={mobile ? 'w-[18px] h-[18px]' : 'w-4 h-4'} />}
            </button>
        </div>
    );
};
