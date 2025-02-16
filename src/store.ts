import { resourceLimits } from "worker_threads";
import dbPromise from "./db.js";

export const labeledAccount = (
  did: string,
  subject: string,
  rkey: string,
  isDelete: boolean
) => {
  console.log(
    `${did} has been labeled for following ${subject} with rkey ${rkey}`
  );

  try {
    if (isDelete) {
      deleteLabeledAccount(did, rkey);
    } else {
      addLabeledAccount(did, subject, rkey);
    }
  } catch (e) {
    console.log("Error:", e);
  }
};

async function addLabeledAccount(did: string, subject: string, rkey: string) {
  const db = await dbPromise;

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

async function deleteLabeledAccount(did: string, subject: string) {
  const db = await dbPromise;

  try {
    const result = await db.run(
      "DELETE FROM labeled WHERE did = ? AND subject = ?",
      did,
      subject
    );
    if (result.changes > 0) {
      console.log("Successfully deleted the labeled account");
    } else {
      console.log("No labeled account found to delete");
    }
  } catch (err) {
    console.log("Error deleting from the database:", err);
  }
}

export async function findLabeledAccount(did: string, rkey: string) {
  const db = await dbPromise;
  try {
    const result = await db.get(
      "SELECT * FROM labeled WHERE did = ? AND rkey = ?",
      did,
      rkey
    );

    if (result) {
      console.log("Labeled account found:", result);
      return result;
    }
  } catch (err) {
    console.log("Error querying the database:", err);
  }
}
