import { p, type LegalDoc } from "./types";

export const conductDoc: LegalDoc = {
  slug: "conduct",
  title: "Code of Conduct",
  description:
    "How participants, mentors and organizers are expected to behave at Crack The Code Extended.",
  lede: "Crack The Code Extended should be challenging, fair and welcoming for everyone. All participants, mentors and organizers are expected to follow this code.",
  clauses: [
    {
      title: "Be respectful",
      blocks: [
        p(
          "Treat everyone with respect, online and on site. Harassment, insults and discriminatory language are not tolerated.",
        ),
      ],
    },
    {
      title: "Play fair",
      blocks: [
        p(
          "Compete with your own squad's skills. Keep solutions to yourselves until the competition ends.",
        ),
      ],
    },
    {
      title: "Hack responsibly",
      blocks: [
        p(
          "Only target the challenges you are given. Skills learned here should never be used against systems you do not have permission to test.",
        ),
      ],
    },
    {
      title: "Report problems",
      blocks: [
        p(
          "If you experience or witness a violation, report it to the organizers. Reports are handled privately.",
        ),
      ],
    },
    {
      title: "Consequences",
      blocks: [
        p(
          "Violations may result in a warning, removal from the event or disqualification of the squad.",
        ),
      ],
    },
  ],
};
