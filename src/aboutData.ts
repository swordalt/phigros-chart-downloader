
export interface UpdateLog {
    date: string;
    content: string;
}

export const projectDescription = "Phigros Chart Downloader is a project for exploring Phigros assets by song. In addition, there is the useful feature of directly exporting assets into a playable chart file for Phira or RPE. It also comes with a sleek user interface for easy usage, as well as an audio player (WIP) and anomaly effects for certain songs.";

export const updateLogs: UpdateLog[] = [
    {
        date: "2026-03-08",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added a sort button to the song selector.</li>
                <li>Added 'Advanced Mode' setting to view more detailed information and tooltips.</li>
                <li>Added 'Bulk Download Mode' to mass-export assets. (WIP)</li>
            </ul>
        `
    },
    {
        date: "2026-02-28",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added debounce time when searching for songs within the dropdown.</li>
                <li>Fixed tooltips rendering outside of the screen on mobile.</li>
                <li>Improved performance in general.</li>
            </ul>
        `
    },
    {
        date: "2026-02-25",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added setting to control illustration type within exported charts.</li>
                <li>Added chart constants within difficulty selection when exporting a chart.</li>
                <li>Improved the audio player's functionality when fetching songs.</li>
                <li>Optimized checking for available chart difficulties upon selecting a song.</li>
            </ul>
        `
    },
    {
        date: "2026-01-22",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added button to reset settings to their default values.</li>
                <li>Added missing aliases/abbreviations for a bunch of songs.</li>
                <li>Fixed the About menu on landscape mobile devices.</li>
            </ul>
        `
    },
    {
        date: "2026-01-19",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added blurred and low-resolution illustrations to the file table.</li>
                <li>Added tooltips to view the resolutions of all image types.</li>
                <li>Changed the FAQ page's contents.</li>
                <li>Fixed the song ID tooltip rendering below the audio player.</li>
            </ul>
        `
    },
    {
        date: "2026-01-18",
        content: `
            <ul class="list-disc list-inside space-y-1">
                <li>Added an 'About' page for information and update/version history.</li>
                <li>Added a tooltip to view/copy the selected song's ID.</li>
                <li>Added a warning for 彩's IN chart crashing Phira.</li>
                <li>Added song-specific effects to DESTRUCTION 3,2,1 and Aleph-0.</li>
                <li>Added proper difficulty constants into 'info.txt' and 'info.yml'.</li>
                <li>Added an indicator to songs with effects when 'Song-Specific Effects' is enabled in settings.</li>
                <li>Improved Luminescence's fireworks shader on iOS.</li>
                <li>Changed dependencies and requirements for certain settings.</li>
                <li>Changed default values for settings.</li>
                <li>Fixed the grammar/formatting of text.</li>
            </ul>
        `
    },
];
//<li></li>