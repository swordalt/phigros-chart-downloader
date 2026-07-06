
import { Song } from '../types';

export const VERSION_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/version.txt';
export const INFO_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/info.tsv';
export const DIFFICULTY_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/difficulty.tsv';
export const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1457995664054292563/mjnZD8Eh5ni1w-4KOE6trXJjD3e72drhHHMBgjJbRPkZvxn_GWtzzfjzYKfihH8w4ADK';

export const fetchVersion = async (): Promise<string> => {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.status} ${response.statusText}`);
    }
    return (await response.text()).trim();
};

export const fetchSongs = async (): Promise<Song[]> => {
    const [infoRes, diffRes] = await Promise.all([
        fetch(INFO_URL),
        fetch(DIFFICULTY_URL)
    ]);

    if (!infoRes.ok) {
        throw new Error(`Failed to fetch song list: ${infoRes.statusText}`);
    }
    // We try to fetch difficulties, but if it fails we proceed with empty difficulty data
    const diffText = diffRes.ok ? await diffRes.text() : '';
    const infoText = await infoRes.text();

    const difficultyMap = new Map<string, { EZ?: string, HD?: string, IN?: string, AT?: string }>();
    if (diffText) {
        diffText.split('\n').forEach(line => {
            if (!line.trim()) return;
            const parts = line.split('\t');
            if (parts.length >= 1) {
                const id = parts[0].trim();
                difficultyMap.set(id, {
                    EZ: (parts[1] || '').trim() || undefined,
                    HD: (parts[2] || '').trim() || undefined,
                    IN: (parts[3] || '').trim() || undefined,
                    AT: (parts[4] || '').trim() || undefined,
                });
            }
        });
    }

    return infoText
        .split('\n')
        .filter(line => line.trim() !== '')
        .map((line): Song | null => {
            const parts = line.split('\t');
            if (parts.length >= 2 && parts[0] && parts[1]) {
                const id = parts[0].trim();
                let name = parts[1].trim();
                const composer = (parts[2] || 'TBA').trim();
                const charters = {
                    EZ: (parts[3] || '').trim() || undefined,
                    HD: (parts[4] || '').trim() || undefined,
                    IN: (parts[5] || '').trim() || undefined,
                    AT: (parts[6] || '').trim() || undefined,
                };

                const difficulties = difficultyMap.get(id);

                if (id === 'AnotherMe.NeutralMoon') {
                    name = 'Another Me (Neutral Moon)';
                } else if (id === 'AnotherMe.DAAN') {
                    name = 'Another Me (DAAN)';
                }

                return { id, name, composer, charters, difficulties };
            }
            return null;
        })
        .filter((song): song is Song => song !== null);
};

const sendDiscordNotification = async (content: string) => {
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
            }),
        });
    } catch (error) {
        console.error('Failed to send Discord webhook notification:', error);
    }
};

export const sendChartDownloadNotification = async (songName: string, difficulty: string, chartId: string) => {
    sendDiscordNotification(`**${songName}**'s **${difficulty}** chart has been downloaded. (ID: ${chartId})`);
};

export const sendAssetDownloadNotification = async (songName: string, assetType: string) => {
    sendDiscordNotification(`**${songName}**'s **${assetType}** asset has been downloaded.`);
};

export const sendAllAssetsDownloadNotification = async (songName: string) => {
    sendDiscordNotification(`**${songName}**'s **assets** have been downloaded.`);
};

export const checkUrlExists = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch {
        return false;
    }
};
