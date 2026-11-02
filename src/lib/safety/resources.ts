// Crisis resources shown in the app. United States only for now.
// Every entry must be re-verified (number, hours, wording) before public release.
// To add a country, add an entry keyed by its ISO code.

export type CrisisResource = {
  name: string;
  action: string;
  href: string;
  description: string;
};

export type RegionResources = {
  region: string;
  emergency: CrisisResource;
  resources: CrisisResource[];
  verificationStatus: "unverified-before-release";
};

export const CRISIS_RESOURCES: Record<string, RegionResources> = {
  US: {
    region: "United States",
    emergency: {
      name: "Emergency services",
      action: "Call 911",
      href: "tel:911",
      description: "If you or someone else is in immediate danger.",
    },
    resources: [
      {
        name: "988 Suicide & Crisis Lifeline",
        action: "Call or text 988",
        href: "tel:988",
        description:
          "Free, confidential support 24/7 for anyone in distress or thinking about suicide.",
      },
      {
        name: "Crisis Text Line",
        action: "Text HOME to 741741",
        href: "sms:741741?&body=HOME",
        description: "Free 24/7 text support with a trained crisis counselor.",
      },
      {
        name: "National Domestic Violence Hotline",
        action: "Call 1-800-799-7233",
        href: "tel:18007997233",
        description: "Support for anyone experiencing abuse in a relationship.",
      },
      {
        name: "Childhelp National Child Abuse Hotline",
        action: "Call 1-800-422-4453",
        href: "tel:18004224453",
        description: "For concerns about a child's safety, or abuse you experienced as a child.",
      },
    ],
    verificationStatus: "unverified-before-release",
  },
};

export const DEFAULT_REGION = "US";

export function getRegionResources(region: string = DEFAULT_REGION): RegionResources {
  return CRISIS_RESOURCES[region] ?? CRISIS_RESOURCES[DEFAULT_REGION];
}
