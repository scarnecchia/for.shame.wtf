import fs from "node:fs";

import { label, labelerServer } from "./label.js";
import logger from "./logger.js";
import { findLabeledAccount, labeledAccount } from "./store.js";
import { LABELS } from "./constants.js";

const did = "did:plc:xyt4nvopdngxehb4agbav6nd";
const rkey = "3lmtkq2qybx2j";

const result = await findLabeledAccount(did, rkey);

if (result) {
  logger.info(`Found labeled account for DID ${did} and RKEY ${rkey}`);
  label(result.did, result.subject, true);
  labeledAccount(result.did, result.subject, result.rkey, true);
}

function shutdown() {
  try {
    fs.writeFileSync("cursor.txt", jetstream.cursor!.toString(), "utf8");
  } catch (error) {
    logger.error(`Error shutting down gracefully: ${error}`);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

