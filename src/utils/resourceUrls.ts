
export type ProxySource = 'github' | 'jsdelivr' | 'jsdelivr-gcore' | 'ghproxy-net' | 'ghfast-top';

export interface ProxySourceOption {
    id: ProxySource;
    label: string;
    description: string;
}

export const PROXY_SOURCES: ProxySourceOption[] = [
    { id: 'github', label: 'GitHub (Default)', description: 'Official GitHub servers. Fastest and most reliable option if GitHub is available in your region.' },
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
