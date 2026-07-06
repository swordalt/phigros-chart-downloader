
import React, { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';

type WebkitAudioWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};

interface AudioPlayerControlProps {
    audio: HTMLAudioElement;
    songName?: string;
    artist?: string;
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
    const response = await fetch(src, { cache: 'force-cache', signal });
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

export const AudioPlayerControl: React.FC<AudioPlayerControlProps> = ({ audio, songName, artist }) => {
    const { setSettings } = useSettings();
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [decodedDuration, setDecodedDuration] = useState<number | null>(null);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPlaying, setIsPlaying] = useState(!audio.paused);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    // We can use isHovered for styling if needed
    void isHovered;

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
            setVolume(audio.volume);
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
        setVolume(audio.volume);
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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        let time = Number(e.target.value);
        // Clamp to valid range
        if (duration > 0 && time > duration) {
            time = duration;
        }
        if (time < 0) time = 0;
        
        setCurrentTime(time);
        audio.currentTime = time;
    };
    
    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        // Resume playback if it was paused (e.g. ended) and we seeked to a valid position
        if (audio.paused && duration > 0 && currentTime < duration) {
            audio.play().catch(err => console.warn("Could not resume playback:", err));
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        audio.volume = val;
        setVolume(val);
        setSettings(prev => ({ ...prev, newUiAudioVolume: val }));

        if (val > 0 && isMuted) {
            audio.muted = false;
            setIsMuted(false);
        }
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
        <div 
            className="flex flex-col items-start w-full sm:w-[420px] bg-slate-800/80 p-3 rounded-lg border border-slate-700 backdrop-blur-md shadow-lg transition-all hover:bg-slate-800"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
             <div className="flex items-center justify-between w-full mb-1 overflow-hidden">
                <div className="flex-1 overflow-hidden relative h-5">
                    <div className={`whitespace-nowrap absolute top-0 left-0 flex items-center ${
                        ((songName?.length || 0) + (artist?.length || 0) > 30)
                            ? 'animate-marquee' 
                            : ''
                    }`}>
                        <span className="text-xs text-brand-cyan uppercase tracking-wider mr-8">
                            Playing: <span className="font-bold">{songName || 'Unknown'}</span> by <span className="font-bold">{artist || 'Unknown'}</span>
                        </span>
                        {/* Duplicate for seamless scrolling */}
                        {((songName?.length || 0) + (artist?.length || 0) > 30) && (
                            <span className="text-xs text-brand-cyan uppercase tracking-wider mr-8">
                                Playing: <span className="font-bold">{songName || 'Unknown'}</span> by <span className="font-bold">{artist || 'Unknown'}</span>
                            </span>
                        )}
                    </div>
                </div>
                {!isFullyLoaded && duration > 0 && (
                    <span className="text-[10px] text-slate-400 italic flex items-center gap-1 ml-2 shrink-0">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                        Loading...
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3 w-full">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan hover:text-slate-900 transition-all focus:outline-none shrink-0"
                >
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                </button>

                {/* Progress Bar - Improved sizing to prevent overflow */}
                <input 
                    type="range" 
                    min={0} 
                    max={duration || 0} 
                    value={currentTime} 
                    onChange={handleSeek}
                    onMouseDown={handleDragStart}
                    onMouseUp={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchEnd={handleDragEnd}
                    disabled={!duration || !isFullyLoaded}
                    className="flex-1 min-w-0 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:accent-cyan-300 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {/* Time Display */}
                <div className="flex gap-0.5 text-[10px] font-mono text-slate-300 min-w-[65px] justify-end tabular-nums shrink-0">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-slate-500">/</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-4 bg-slate-600 shrink-0 hidden sm:block"></div>

                {/* Volume Control */}
                <div className="hidden sm:flex items-center gap-2 group/volume shrink-0">
                    <button 
                        onClick={toggleMute}
                        className="text-slate-400 hover:text-white transition-colors focus:outline-none"
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted || volume === 0 ? (
                            <SpeakerXMarkIcon className="w-4 h-4" />
                        ) : (
                            <SpeakerWaveIcon className="w-4 h-4" />
                        )}
                    </button>
                    <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.05}
                        value={isMuted ? 0 : volume} 
                        onChange={handleVolumeChange}
                        className="w-12 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-white focus:outline-none"
                        title={`Volume: ${Math.round(volume * 100)}%`}
                    />
                </div>
            </div>
        </div>
    );
};
