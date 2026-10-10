export type Faq = {
  question: string;
  answer: string;
};

export const faqs: Faq[] = [
  {
    question: "Who can join?",
    answer:
      "All students currently enrolled in the College of Computing Education (CCE). Every member of a team must be a currently enrolled CCE student.",
  },
  {
    question: "How many members can a team have?",
    answer:
      "One (1) to four (4) members. Teams must register their team name and all members before the announced deadline.",
  },
  {
    question: "What does a flag look like?",
    answer:
      "The standard format is CTC{string_here} unless otherwise specified in the challenge description. Submissions are case-sensitive.",
  },
  {
    question: "What should we bring?",
    answer:
      "A laptop for each member is highly recommended, though sharing laptops within the team is allowed. Each team must bring their own extension cords.",
  },
  {
    question: "Which tools are allowed?",
    answer:
      "Only free, open-source, or community-edition tools (e.g., Kali Linux, Burp Suite Community, Wireshark, Python). Premium or paid software is prohibited, and so are AI/LLM tools such as ChatGPT, Claude, GitHub Copilot and Gemini.",
  },
  {
    question: "Can we use the internet?",
    answer:
      "Yes, for documentation and technical references, as long as it does not violate the communication, AI, or cloud storage rules. VPNs, Private/Custom DNS, messaging apps and headsets are not allowed.",
  },
];
