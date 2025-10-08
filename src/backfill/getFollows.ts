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

  let get: AtpAgent;
  let pdsUrl: string | null;
  let current_cursor: string | undefined = undefined;

  try {
    pdsUrl = await getPDS(did);

    if (!pdsUrl) {
      // If getPDS returns null, log it and exit this function for this DID.
      logger.warn(
        `Could not determine PDS for ${did}. Skipping follow check for this DID.`,
      );
      return; // Stop processing for this specific (did, subject) pair.
    }

    // If we get here, pdsUrl is a valid string.
    get = new AtpAgent({
      service: pdsUrl, // Now we know pdsUrl is a string
    });

    // Don't forget to await the login and handle its errors too!
    await get.login({
      identifier: BSKY_IDENTIFIER, // Make sure BSKY_IDENTIFIER is imported/defined
      password: BSKY_PASSWORD, // Make sure BSKY_PASSWORD is imported/defined
    });
    logger.info(
      `Successfully initialized and logged in for ${did} on PDS ${pdsUrl}`,
    );
  } catch (error) {
    // This catches errors from getPDS itself (if it somehow still throws despite returning null)
    // or from new AtpAgent, or from agent.login
    logger.error(
      `Failed to initialize AtpAgent or login for ${did} on PDS: ${error instanceof Error ? error.message : String(error)}`,
    );
    return; // Stop processing for this specific (did, subject) pair.
  }

  try {
    do {
      let follows;
      try {
        follows = await limit(() =>
          get.com.atproto.repo.listRecords({
            repo: did,
            collection: "app.bsky.graph.follow",
            limit: 100,
            cursor: current_cursor,
          }),
        );
      } catch (error) {
        let errorDetails = String(error); // Default to string representation
        if (error instanceof Error) {
          errorDetails = `Name: ${error.name}, Message: ${error.message}`;
          // For XRPCError, you might have more specific properties
          if ("status" in error && "error" in error) {
            // @ts-ignore // Assuming error might be an XRPCError like type
            errorDetails += `, Status: ${error.status}, XRPC Error: ${error.error}`;
          }
        }
        logger.warn(
          `Error fetching follows for ${did}. Details: ${errorDetails}`,
        );
        // You might want to log the full error object for deep inspection in debug mode
        // logger.debug("Full error object for listRecords:", error);
        break; // Exits the do...while loop for this DID if listRecords fails
      }

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
              subject,
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
