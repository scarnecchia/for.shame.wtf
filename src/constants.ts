import { Label } from "./types.js";

export const TARGET = [
  "did:plc:5prledmu36imun2zjc26v5nl",
  "did:plc:yzmo3kmhhazep4mbfapy2mng",
];

export const LABELS: Label[] = [
  {
    rkey: "did:plc:5prledmu36imun2zjc26v5nl",
    identifier: "mattyglesias-follower",
    locales: [
      {
        lang: "en",
        name: "Matt Yglesias Follower",
        description:
          "This user follows Matt Yglesias. This label can be removed by unfollowing Matt Yglesias.",
      },
    ],
  },
  {
    rkey: "did:plc:yzmo3kmhhazep4mbfapy2mng",
    identifier: "mattstoller-follower",
    locales: [
      {
        lang: "en",
        name: "Matthew Stoller Follower",
        description:
          "This user follows Matthew Stoller. This label can be removed by unfollowing Matthew Stoller.",
      },
    ],
  },
];
