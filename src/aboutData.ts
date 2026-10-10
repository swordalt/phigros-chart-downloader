
export interface UpdateLog {
    date: string;
    content: string;
}

export const projectDescription = "Phigros Chart Downloader simplifies the process of obtaining official Phigros chart files for use in Phira, PhiEdit, or any other external program.";

export const updateLogs: UpdateLog[] = [
	{
        date: "v2.0.1",
        content: `
            <ul class="list-disc list-inside space-y-1">
				<li>Improved the individual files table.</li>
                <li>Rechose the background color darkness.</li>
				<li>Added file size preview for charts and individual files.</li>
            </ul>
        `
    },
		{
        date: "v2.0.0",
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