import { open } from "sqlite";
import sqlite3 from "sqlite3";

const bfPromise = open({
  filename: "followers.db",
  driver: sqlite3.Database,
});

export default bfPromise;
