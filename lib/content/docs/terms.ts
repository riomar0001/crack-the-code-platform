import { p, type LegalDoc } from "./types";

export const termsDoc: LegalDoc = {
  slug: "terms",
  title: "Terms of Service",
  description:
    "The terms you agree to when creating an account or registering a squad for Crack The Code Extended.",
  lede: "By creating an account or registering a squad, you agree to these terms.",
  clauses: [
    {
      title: "Accounts",
      blocks: [
        p(
          "You are responsible for the accuracy of the information you provide and for keeping your login details private. Activity on your account is treated as your own.",
        ),
      ],
    },
    {
      title: "Acceptable use",
      blocks: [
        p(
          "Use the platform only to take part in the competition. Testing or attacking anything outside the published challenges is not permitted.",
        ),
      ],
    },
    {
      title: "Challenge content",
      blocks: [
        p(
          "Challenges, files and write-ups provided by the organizers remain their property. Do not redistribute them while the competition is running.",
        ),
      ],
    },
    {
      title: "Availability",
      blocks: [
        p(
          "The platform is provided as is. The organizers will try to keep it available but cannot guarantee uninterrupted access.",
        ),
      ],
    },
    {
      title: "Suspension",
      blocks: [
        p(
          "The organizers may suspend or remove accounts that break these terms, the Rules or the Code of Conduct.",
        ),
      ],
    },
    {
      title: "Changes",
      blocks: [
        p(
          "These terms may be updated. Continued use of the platform after an update means you accept the new terms.",
        ),
      ],
    },
  ],
};
