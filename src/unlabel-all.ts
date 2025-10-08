import dbPromise from './db.js';
import { labelerServer } from './label.js';
import { LABELS } from './constants.js';
import logger from './logger.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const unlabelAll = async () => {
  const db = await dbPromise;

  try {
    const accounts = await db.all('SELECT * FROM labeled');

    if (accounts.length === 0) {
      logger.info('No accounts to unlabel.');
      return;
    }

    for (const account of accounts) {
      const labelInfo = LABELS.find((l) => l.subject === account.subject);

      if (!labelInfo) {
        logger.warn(`No label definition found for subject: ${account.subject}. Skipping.`);
        continue;
      }

      const labelToDelete = [labelInfo.identifier];
      logger.info(`Unlabeling ${account.did} for subject ${account.subject}`);

      try {
        // Negate the label via Bluesky API
        await labelerServer.createLabels({ uri: account.did }, { negate: labelToDelete });
        logger.info(`Successfully sent unlabel request for ${account.did}`);

        // Delete from local database
        const result = await db.run('DELETE FROM labeled WHERE did = ? AND subject = ?', account.did, account.subject);
        if (result.changes > 0) {
          logger.info(`Successfully deleted ${account.did} from the local database.`);
        } else {
          logger.warn(`Could not find ${account.did} in the local database to delete.`);
        }

      } catch (error) {
        logger.error(`Error processing ${account.did}: ${error}`);
      }

      // Respect rate limits
      await sleep(500); // 500ms delay between each account
    }

    logger.info('Finished unlabeling all accounts.');

  } catch (error) {
    logger.error(`Failed to fetch accounts from the database: ${error}`);
  }
};

unlabelAll().catch((error) => {
  logger.error('An unexpected error occurred:', error);
  process.exit(1);
});
