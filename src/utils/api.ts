
import { Song } from '../types';

export const VERSION_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/version.txt';
export const INFO_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/info.tsv';
export const DIFFICULTY_URL = 'https://raw.githubusercontent.com/7aGiven/Phigros_Resource/refs/heads/info/difficulty.tsv';
const DISCORD_WEBHOOK_URL_ENCODED = 'aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU1MDkyNjI0NDAwMTA5NTcwNC80RVB6Ui1IaG50Zkh5U3pueU9nb2IwQWJMbW1TMGJodzlybjVtVXBCNVRIRlBsbmFkbE52ckZ4aXdLaDM0bms1RWJsdg==';
const getDiscordWebhookUrl = () => atob(DISCORD_WEBHOOK_URL_ENCODED);

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
        await fetch(getDiscordWebhookUrl(), {
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

export const sendChartDownloadNotification = async (songName: string, difficulty: string, chartId: string, analyticsEnabled: boolean) => {
    if (analyticsEnabled) {
        sendDiscordNotification(`**${songName}**'s **${difficulty}** chart has been downloaded. (ID: ${chartId})`);
    } else {
        sendDiscordNotification(`A chart has been downloaded. (ID: ${chartId})`);
    }
};

export const sendAssetDownloadNotification = async (songName: string, assetType: string, songId: string, analyticsEnabled: boolean) => {
    if (analyticsEnabled) {
        sendDiscordNotification(`**${songName}**'s **${assetType}** asset has been downloaded.`);
    } else {
        sendDiscordNotification(`An asset has been downloaded. (ID: ${songId})`);
    }
};

export const sendAllAssetsDownloadNotification = async (songName: string, songId: string, analyticsEnabled: boolean) => {
    if (analyticsEnabled) {
        sendDiscordNotification(`**${songName}**'s **assets** have been downloaded.`);
    } else {
        sendDiscordNotification(`All assets for a song have been downloaded. (ID: ${songId})`);
    }
};

export const checkUrlExists = async (url: string): Promise<boolean> => {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch {
        return false;
    }
};
