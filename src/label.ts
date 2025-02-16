import { ComAtprotoLabelDefs } from '@atcute/client/lexicons';
import { LabelerServer } from '@skyware/labeler';

import { DID, SIGNING_KEY } from './config.js';
import { LABELS } from './constants.js';
import logger from './logger.js';

export const labelerServer = new LabelerServer({ did: DID, signingKey: SIGNING_KEY });

export const label = (did: string, subject: string, negate: boolean) => {
  logger.info(`Received subject: ${did} with subject: ${subject} and negate: ${negate}`);

  try {
    if (negate) {
      deleteLabel(did, subject);
    } else {
      addOrUpdateLabel(did, subject);
    }
  } catch (error) {
    logger.error(`Error in \`label\` function: ${error}`);
  }
};

function deleteLabel(did: string, subject: string) {
  const delLabel = LABELS.find((label) => label.subject === subject);

  if (!delLabel || delLabel.identifier.length === 0) {
    logger.info(`No labels to delete`);
    return;
  }

  const labelToDelete: string[] = [delLabel.identifier];

  logger.info(`Labels to delete: ${labelToDelete.join(', ')}`);
  try {
    labelerServer.createLabels({ uri: did }, { negate: labelToDelete });
    logger.info('Successfully deleted all labels');
  } catch (error) {
    logger.error(`Error deleting all labels: ${error}`);
  }
}

function addOrUpdateLabel(did: string, subject: string) {
  const newLabel = LABELS.find((label) => label.subject === subject);
  if (!newLabel) {
    logger.warn(`New label not found: ${subject}. Likely liked a post that's not one for labels.`);
    return;
  }
  logger.info(`New label: ${newLabel.identifier}`);

  try {
    labelerServer.createLabel({ uri: did, val: newLabel.identifier });
    logger.info(`Successfully labeled ${did} with ${newLabel.identifier}`);
  } catch (error) {
    logger.error(`Error adding new label: ${error}`);
  }
}
