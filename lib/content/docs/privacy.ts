import { p, ul, type LegalDoc } from "./types";

export const privacyDoc: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  description:
    "What information Crack The Code Extended collects, how it is used, and who can see it.",
  lede: "This policy explains what information Crack The Code Extended collects and how it is used.",
  clauses: [
    {
      title: "What we collect",
      blocks: [
        ul(
          "First name, last name, alias, student ID number and email address of each squad member.",
          "Squad name.",
          "Competition platform (CTFd) credentials generated for your squad and each member.",
          "Flag submissions and activity on the platform, with timestamps.",
        ),
      ],
    },
    {
      title: "How we use it",
      blocks: [
        ul(
          "To run the competition, verify participants and calculate scores.",
          "To contact you about the event, results and prizes.",
          "To display squad names on the public scoreboard.",
        ),
      ],
    },
    {
      title: "Who can see it",
      blocks: [
        p(
          "Your information is shared only with the organizers: the College of Computing Education, the College of Computing Education: Skills Clinic, and the University of Mindanao. It is not sold to third parties.",
        ),
      ],
    },
    {
      title: "Retention",
      blocks: [
        p(
          "Information is kept for as long as needed to run the event and publish results, then deleted or anonymized.",
        ),
      ],
    },
    {
      title: "Your choices",
      blocks: [
        p(
          "You may ask the organizers to correct or delete your information through the Contact link.",
        ),
      ],
    },
  ],
};
