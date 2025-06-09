import { label } from "./../label.js";
import bfPromise from "./db.js";
import { LABELS } from "./../constants.js";
import { getFollowers } from "./getFollowers.js";
import { getFollows } from "./getFollows.js";
import { appendData } from "./append.js";
import logger from "../logger.js";

export const main = async () => {
  const db = await bfPromise;
  const TARGETS = LABELS.map((label) => label.subject);

  for (const target of TARGETS) {
    await getFollowers(target);

    const dids = await db.all(
      "SELECT did FROM followers WHERE subject = ?",
      target,
    );

    const getFollowsPromises = dids.map(({ did }) => {
      return getFollows(did, target).catch((error) => {
        // The try/catch you added previously would be here
        logger.error(
          `Error processing did ${did} for target ${target} in getFollows: ${error}`,
        );
        // Optionally, you can return a specific marker for failed promises
        // if you need to distinguish them after Promise.all resolves
      });
    });
    await Promise.all(getFollowsPromises);

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
