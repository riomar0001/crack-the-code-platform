export type Mission = {
  slug: string;
  name: string;
  description: string;
  /** Short "expect this" chips shown at the bottom of the detail panel. */
  tags: string[];
};

export const missions: Mission[] = [
  {
    slug: "web",
    name: "Web Exploitation",
    description: "Identifying and exploiting vulnerabilities in web applications.",
    tags: ["SQLi", "XSS", "IDOR"],
  },
  {
    slug: "crypto",
    name: "Cryptography",
    description:
      "Deciphering hidden messages using classical and modern cryptographic techniques.",
    tags: ["classical ciphers", "modern cryptography"],
  },
  {
    slug: "forensics",
    name: "Forensics",
    description:
      "Analyzing file metadata, memory dumps, network captures (PCAP), and deleted files.",
    tags: ["file metadata", "memory dumps", "PCAP", "deleted files"],
  },
  {
    slug: "osint",
    name: "OSINT",
    description:
      "Open Source Intelligence. Gathering information from public sources to track down specific data.",
    tags: ["public sources", "data tracking"],
  },
  {
    slug: "general",
    name: "General Computing & Logic",
    description: "Basic networking, Linux commands, and algorithmic problem-solving.",
    tags: ["networking", "Linux commands", "algorithms"],
  },
  {
    slug: "pwn",
    name: "PWN",
    description:
      "Binary Exploitation. Exploiting vulnerabilities in compiled programs, such as buffer overflows, format string vulnerabilities, and memory corruption, to gain control of program execution.",
    tags: ["buffer overflows", "format strings", "memory corruption"],
  },
];
