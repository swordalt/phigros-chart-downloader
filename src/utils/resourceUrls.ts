
export type ProxySource = 'github' | 'jsdelivr' | 'jsdelivr-gcore' | 'ghproxy-net' | 'ghfast-top';

export interface ProxySourceOption {
    id: ProxySource;
    label: string;
    description: string;
}

export const PROXY_SOURCES: ProxySourceOption[] = [
    { id: 'github', label: 'GitHub', description: 'Official GitHub servers. Fastest and most reliable option if GitHub is available in your region.' },
    { id: 'jsdelivr', label: 'jsDelivr', description: 'Global GitHub CDN mirror.' },
    { id: 'jsdelivr-gcore', label: 'jsDelivr - Gcore', description: "An alternative for jsDelivr that uses alternate CDNs." },
    { id: 'ghproxy-net', label: 'ghproxy.net', description: 'Community GitHub proxy.' },
    { id: 'ghfast-top', label: 'ghfast.top', description: 'Alternative community GitHub proxy.' },
];

const REPO = '7aGiven/Phigros_Resource';

export function getResourceUrl(proxySource: ProxySource, branch: string, path: string): string {
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/refs/heads/${branch}/${path}`;
    switch (proxySource) {
        case 'jsdelivr':
            return `https://cdn.jsdelivr.net/gh/${REPO}@${branch}/${path}`;
        case 'jsdelivr-gcore':
            return `https://gcore.jsdelivr.net/gh/${REPO}@${branch}/${path}`;
        case 'ghproxy-net':
            return `https://ghproxy.net/${rawUrl}`;
        case 'ghfast-top':
            return `https://ghfast.top/${rawUrl}`;
        case 'github':
        default:
            return rawUrl;
    }
}

// Songs whose illustration differs per difficulty (stored as `${songId}_${diff}.png`).
const PER_DIFFICULTY_ILLUSTRATION_SONGS = new Set([
    'WhatdoyouwantmorethanaHappyending.Apo11oHALOprogramft安月名莉子大瀬良あい',
]);

export const ILLUSTRATION_DIFFICULTIES = ['EZ', 'HD', 'IN', 'AT'];

export function hasPerDifficultyIllustrations(songId: string): boolean {
    return PER_DIFFICULTY_ILLUSTRATION_SONGS.has(songId);
}

// Blur thumbnail for the song list; per-difficulty songs use their AT variant.
export function getBlurIllustrationUrl(proxySource: ProxySource, songId: string): string {
    const name = hasPerDifficultyIllustrations(songId) ? `${songId}_AT.png` : `${songId}.png`;
    return getResourceUrl(proxySource, 'illustrationBlur', name);
}

export function getDifficultyIllustrationUrl(proxySource: ProxySource, songId: string, difficulty: string): string {
    return getResourceUrl(proxySource, 'illustration', `${songId}_${difficulty}.png`);
}
