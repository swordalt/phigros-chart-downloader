// Optional GitHub personal access token for higher rate limits.
// raw.githubusercontent.com rejects CORS preflights that carry an Authorization header, so when a token is set,
// requests for the resource repo are sent to the authenticated GitHub contents API instead (raw media type).
// URLs on any other host (jsDelivr, community proxies) are never sent the token.

const RAW_PREFIX = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/';

let githubToken = '';

export const setGithubToken = (token: string) => {
    githubToken = token.trim();
};

export const getGithubToken = () => githubToken;

const toApiRequest = (url: string): { url: string; headers: Record<string, string> } | null => {
    if (!githubToken || !url.startsWith(RAW_PREFIX)) return null;
    const rest = url.slice(RAW_PREFIX.length);
    const slash = rest.indexOf('/');
    if (slash < 0) return null;
    const branch = rest.slice(0, slash);
    const path = rest.slice(slash + 1).split('/').map(seg => encodeURIComponent(decodeURIComponent(seg))).join('/');
    return {
        url: `https://api.github.com/repos/7aGiven/Phigros_Resource/contents/${path}?ref=${encodeURIComponent(branch)}`,
        headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    };
};

/** fetch() that transparently uses the GitHub token for resource-repo URLs when one is configured. */
export const resourceFetch = (url: string, init: RequestInit = {}): Promise<Response> => {
    const api = toApiRequest(url);
    if (!api) return fetch(url, init);
    return fetch(api.url, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), ...api.headers } });
};
