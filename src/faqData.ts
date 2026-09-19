


export interface FAQEntry {
  question: string;
  // Fix: Changed answer type from React.ReactNode to string to avoid JSX in a .ts file.
  answer: string;
}

export const faqData: FAQEntry[] = [
  {
    question: "How do I download a chart to use in Phira or RPE?",
    answer: "First, select a song from the dropdown menu. Second, select an available difficulty (EZ, HD, IN, or AT) from the left. Third, click the 'Export as Chart' button.",
  },
   {
    question: "What programs work with these files?",
    answer: "For playing, Phira is your best bet. Recent versions have excellent compatability with the official chart format. Other simulators such as phi-sim work excellently as well, despite being deprecated.",
  },
  {
    question: "What is a PEZ file?",
    answer: "A PEZ file is a Phi Edit ZIP (PEZ); essentially a ZIP file. Most programs should detect and handle this file type, however you can change the exported file extension to a universal ZIP in settings.",
  },
  {
    question: "Why are newer songs not present here?",
    answer: "This website relies on a third-party GitHub repository. If they don't add newer content, it won't appear here.",
  },
  {
    question: "The website is broken and refuses to work.",
    answer: 'Ensure you can access GitHub and you are not rate-limited. Check privacy-enforcing extensions as they may block the downloading of files from raw.githubusercontent.com.',
  },
    {
    question: "Why are there no April Fools or Legacy charts?",
    answer: 'There are already many places to get April Fools, legacy, and removed charts. Such as https://drive.google.com/drive/folders/1LcJ2Ublu6TNNTqUph61ItzGwJTqG-IQu',
  },
];
