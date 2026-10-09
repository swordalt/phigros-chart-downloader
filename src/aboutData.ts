
export interface UpdateLog {
    date: string;
    content: string;
}

export const projectDescription = "Phigros Chart Downloader simplifies the process of obtaining official Phigros chart files for use in Phira, PhiEdit, or any other external program.";

export const updateLogs: UpdateLog[] = [
	{
        date: "v2.0 - Oct 8th, 2026",
        content: `
            <ul class="list-disc list-inside space-y-1">
				<li>Complete redesign of the UI and download process.</li>
                <li>Added option to disable blur.</li>
				<li>Added optional GitHub access token setting.</li>
            </ul>
        `
    },
];
//<li></li>