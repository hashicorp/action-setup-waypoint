import * as core from '@actions/core';
import { getBinary } from './install';

export const PRODUCT_NAME = 'waypoint';

export async function run(): Promise<void> {
  try {
    // The version is the version of Waypoint we want to
    // download and install
    const version = core.getInput('version');

    // Download or return the cached path for the specified version
    const path = await getBinary(PRODUCT_NAME, version);

    // Make command available for future commands or actions
    core.addPath(path);
  } catch (error) {
    if (!error || !(error instanceof Error)) {
      // eslint-disable-next-line i18n-text/no-en
      core.setFailed('Invalid error');
      return;
    }

    if ('message' in error) {
      core.setFailed(error?.message);
      return;
    }

    core.setFailed(error);
  }
}

run();
