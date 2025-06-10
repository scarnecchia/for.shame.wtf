import { label } from "./../label.js";
import bfPromise from "./db.js";
import { LABELS } from "./constants.js";
import { getFollowers } from "./getFollowers.js";
import { getFollows } from "./getFollows.js";
import { appendData } from "./append.js";
import logger from "../logger.js";
import { getPDS } from "./utils.js";
import { setGlobalDispatcher, Agent as Agent } from "undici";
setGlobalDispatcher(new Agent({ connect: { timeout: 20_000 } }));
import { BSKY_IDENTIFIER, BSKY_PASSWORD, PDS } from "../config.js";
import { AtpAgent } from "@atproto/api";

export const main = async () => {
  const db = await bfPromise;
  const TARGETS = LABELS.map((label) => label.subject);

  for (const target of TARGETS) {
    await getFollowers(target);

    const dids = await db.all(
      "SELECT did FROM followers WHERE subject = ?",
      target,
    );

    for (const { did } of dids) {
      try {
        await getFollows(did, target);
      } catch (error) {
        logger.error(
          `Error processing did ${did} for target ${target}: ${error}`,
        );
        // The loop will continue to the next did
      }
    }

    const didToLabel = await db.get(
      "SELECT did FROM followers WHERE subject = ? AND rkey IS NOT NULL",
      target,
    );

    for (const { didLabel } of didToLabel) {
      label(didLabel, target, false);
    }
  }

  await appendData();
};

try {
  main().then(() => logger.info("Backfill completed"));
} catch (e) {
  logger.info("Error:", e);
}
