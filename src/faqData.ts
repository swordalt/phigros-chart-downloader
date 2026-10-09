
export interface FAQEntry {
  question: string;
  answer: string;
  // Optional link appended to the end of the answer.
  link?: { text: string; url: string };
}

export const faqData: FAQEntry[] = [
  {
    question: "How do I download a chart to use in Phira or RPE?",
    answer: "Pick a song from the list on the left, choose a difficulty (EZ, HD, IN or AT), then click 'Export for Phira & RPE'.",
  },
  {
    question: "What programs work with these files?",
    answer: "For playing, Phira is your best bet — recent versions have excellent compatibility with the official chart format. Other simulators such as phi-sim work well too, despite being deprecated.",
  },
  {
    question: "What is a PEZ file?",
    answer: "A Phi Edit ZIP — essentially a ZIP file. Most programs detect and handle it, but you can switch the exported extension to ZIP in Settings.",
  },
  {
    question: "Why are newer songs not present here?",
    answer: "This website relies on a third-party GitHub repository. If they don't add newer content, it won't appear here.",
  },
  {
    question: "The website is broken and refuses to work.",
    answer: "Make sure you can reach GitHub and are not rate-limited. Privacy extensions may also block downloads from raw.githubusercontent.com — or try another proxy in Settings.",
  },
  {
    question: "Why are there no April Fools or Legacy charts?",
    answer: "There are already many places to get April Fools, legacy and removed charts, such as",
    link: { text: 'this Google Drive folder', url: 'https://drive.google.com/drive/folders/1LcJ2Ublu6TNNTqUph61ItzGwJTqG-IQu' },
  },
];
