import { label } from "./../label.js";
import dbPromise from "./db.js";
import { LABELS } from "./../constants.js";
import { getFollowers } from "./getFollowers.js";
import { getFollows } from "./getFollows.js";

const TARGETS = LABELS.map((label) => label.subject);

for (const target of TARGETS) {
  await getFollowers(target);

  const db = await dbPromise;

  const dids = await db.all(
    "SELECT did FROM follower WHERE subject = ?",
    target
  );

  for (const { did } of dids) {
    await getFollows(did, target);
  }

  const didToLabel = await db.all(
    "SELECT did FROM follower WHERE subject = ? AND rkey IS NOT NULL",
    target
  );

  for (const { didLabel } of didToLabel) {
    label(didLabel, target, false);
  }
}
