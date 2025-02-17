import { setGlobalDispatcher, Agent as Agent } from "undici";
setGlobalDispatcher(new Agent({ connect: { timeout: 20_000 } }));
import { BSKY_IDENTIFIER, BSKY_PASSWORD } from "../config.js";
import { AtpAgent } from "@atproto/api";
import { limit } from "./rateLimit.js";
import bfPromise from "./db.js";
import logger from "../logger.js";
import { getPDS } from "./utils.js";

export const getFollows = async (did: string, subject: string) => {
  logger.info(`Searching for ${did}'s record of following ${subject}`);
  const db = await bfPromise;

  let current_cursor: string | undefined = undefined;

  const get = new AtpAgent({
    service: await getPDS(did),
  });

  get.login({
    identifier: BSKY_IDENTIFIER,
    password: BSKY_PASSWORD,
  });

  try {
    do {
      const follows = await limit(() =>
        get.com.atproto.repo.listRecords({
          repo: did,
          collection: "app.bsky.graph.follow",
          limit: 100,
          cursor: current_cursor,
        })
      );

      logger.info(`Fetched ${follows.data.records.length} follows`);

      if (!follows.data.records.length) {
        logger.info("No more records to process");
        break;
      }

      let found = 0;

      for (const follow of follows.data.records) {
        if (follow.value.subject === subject) {
          const rkey = follow.uri.split("/").pop();
          found = 1;

          logger.info(`rkey found for ${did} and ${subject}: ${rkey}`);
          try {
            await db.run(
              "UPDATE followers SET rkey = ? where did = ? and subject = ?",
              rkey,
              did,
              subject
            );
            logger.info("Successfully saved to the database");
          } catch (err) {
            logger.error("Error saving to the database:", err);
          }
        } else {
          found = 0;
        }
      }

      if (found === 1) {
        logger.info("No more records to process");
        break;
      }
      current_cursor = follows.data.cursor;
    } while (current_cursor);
  } catch (error) {
    logger.warn(`Error in getFollows: ${error}`);
  }
};
