import { label } from "./../label.js";
import bfPromise from "./db.js";
import { LABELS } from "./../constants.js";
import { getFollowers } from "./getFollowers.js";
import { getFollows } from "./getFollows.js";
import { appendData } from "./append.js";
import logger from "../logger.js";

export const main = async () => {
  const TARGETS = LABELS.map((label) => label.subject);

  for (const target of TARGETS) {
    await getFollowers(target);

    const db = await bfPromise;
    const dids = await db.all(
      "SELECT did FROM followers WHERE subject = ?",
      target
    );

    for (const { did } of dids) {
      await getFollows(did, target);
    }

    const didToLabel = await db.get(
      "SELECT did FROM followers WHERE subject = ? AND rkey IS NOT NULL",
      target
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
