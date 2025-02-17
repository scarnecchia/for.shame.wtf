import bfPromise from "./db.js";
import dbPromise from "../db.js";

export const appendData = async () => {
    const bf = await bfPromise;
    const db = await dbPromise;

    const followers = await bf.all("SELECT * FROM followers where rkey IS NOT NULL");

    for (const follower of followers) {
        const { subject, did, rkey } = follower;

        try {
        await db.run(
            "INSERT INTO labeled (did, subject, rkey) VALUES (?, ?, ?)",
            did,
            subject,
            rkey
        );
        console.log("Successfully saved to the database");
        } catch (err) {
        console.log("Error saving to the database:", err);
        }
    }
};