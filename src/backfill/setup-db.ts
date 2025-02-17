import dbPromise from "./db.js";

async function setup() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      did TEXT NOT NULL,
      rkey TEXT NOT NULL
    )
  `);
  console.log("Table created");
}

setup().catch((err) => {
  console.error("Error setting up the database:", err);
});
