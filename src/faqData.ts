


export interface FAQEntry {
  question: string;
  // Fix: Changed answer type from React.ReactNode to string to avoid JSX in a .ts file.
  answer: string;
}

export const faqData: FAQEntry[] = [
  {
    question: "How do I download a chart to use in Phira or RPE?",
    answer: "First, select a song from the dropdown menu. Second, select an available difficulty (EZ, HD, IN, or AT). Third, click the 'Export as Chart' button.",
  },
   {
    question: "What programs work with these files?",
    answer: "For playing, Phira has alright support, however visual bugs may be present in some charts. If you don't mind, phi-sim has perfect support, but it only runs in a web browser and is very old. For editing, RPE has alright support; just don't attempt to save the chart or it will attempt to convert it to an 100MB RPE json. Other editors such as phichain may also support the official format.",
  },
  {
    question: "What is a PEZ file?",
    answer: "A PEZ file is a Phi Edit ZIP (PEZ); essentially a simple ZIP file. Most programs should detect and handle this file type, however you can change the exported file extension to a universal ZIP in settings.",
  },
  {
    question: "Why are newer songs not present here?",
    answer: "This website relies on a third-party GitHub repository. If they don't add newer content, it won't appear here.",
  },
  {
    question: "The website is broken and refuses to work.",
    answer: 'Ensure you can access GitHub and are not ratelimited or blocked. Also check any browser extensions such as adblockers and privacy enforcers that may block GitHub raw files.',
  },
    {
    question: "Why are there no April Fools or Legacy charts?",
    answer: 'This project aims to be synchronized with the latest version of Phigros. In addition, April Fools charts are often weird with song IDs and such, so it would be a hassle to incorporate them into this website.',
  },
];
