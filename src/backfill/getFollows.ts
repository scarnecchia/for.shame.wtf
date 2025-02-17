import { agent, isLoggedIn } from "./agent.js";
import { limit } from "./rateLimit.js";
import dbPromise from "./db.js";

export const getFollows = async (did: string, subject: string) => {
  await isLoggedIn;
  const db = await dbPromise;

  let current_cursor: string | undefined = undefined;

  do {
    const follows = await limit(() =>
      agent.com.atproto.repo.listRecords({
        repo: did,
        collection: "app.bsky.graph.follow",
        limit: 100,
        cursor: current_cursor,
      })
    );

    if (!follows.data.records.length) {
      console.log("No more records to process");
      break;
    }

    await dbPromise;

    for (const follow of follows.data.records) {
      if (follow.value.subject === subject) {
        const rkey = follow.uri.split("/").pop();

        console.log(`Follower: ${rkey}`);
        try {
          await db.run(
            "UPDATE follower SET rkey = ? where did = ? and subject = ?",
            rkey,
            did,
            subject
          );
          console.log("Successfully saved to the database");
        } catch (err) {
          console.log("Error saving to the database:", err);
        }
      }
    }

    current_cursor = follows.data.cursor;
  } while (current_cursor);
};
