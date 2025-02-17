import { agent, isLoggedIn } from "./agent.js";
import { limit } from "./rateLimit.js";
import dbPromise from "./db.js";

export const getFollowers = async (subject: string) => {
  await isLoggedIn;
  const db = await dbPromise;

  let current_cursor: string | undefined = undefined;

  do {
    const followers = await limit(() =>
      agent.app.bsky.graph.getFollowers({
        actor: subject,
        limit: 100,
        cursor: current_cursor,
      })
    );

    if (!followers.data.records.length) {
      console.log("No more records to process");
      break;
    }

    await dbPromise;

    for (const follower of followers.data.records) {
      const followerDid = follower.actor;

      console.log(`Follower: ${followerDid}`);
      try {
        await db.run(
          "INSERT INTO follower (subject, did) VALUES (?, ?)",
          subject,
          followerDid
        );
        console.log("Successfully saved to the database");
      } catch (err) {
        console.log("Error saving to the database:", err);
      }
    }

    current_cursor = followers.data.cursor;
  } while (current_cursor);
};
