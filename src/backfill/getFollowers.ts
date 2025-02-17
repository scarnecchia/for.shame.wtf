import { agent, isLoggedIn } from "./agent.js";
import { limit } from "./rateLimit.js";
import bfPromise from "./db.js";
import logger from "../logger.js";

export const getFollowers = async (subject: string) => {
  logger.info(`Getting followers for ${subject}`);
  await isLoggedIn;
  const db = await bfPromise;

  let current_cursor: string | undefined = undefined;

  do {
    const followers = await limit(() =>
      agent.app.bsky.graph.getFollowers({
        actor: subject,
        limit: 100,
        cursor: current_cursor,
      })
    );

    if (!followers.data.followers.length) {
      logger.info("No more records to process");
      break;
    }

    /*  logger.info(`Fetched ${followers.data.followers.length} followers`);
    logger.info(
      `Followers data structure: ${JSON.stringify(followers.data.followers, null, 2)}`
    ); */

    for (const follower of followers.data.followers) {
      const followerDid = follower.did;
      if (followerDid) {
        logger.info(`Follower: ${followerDid}`);
        try {
          await db.all(
            "INSERT INTO followers (subject, did) VALUES (?, ?)",
            subject,
            followerDid
          );
          logger.info("Successfully saved to the database");
        } catch (err) {
          logger.error("Error saving to the database:", err);
        }
      }
    }

    current_cursor = followers.data.cursor;
  } while (current_cursor);
};
