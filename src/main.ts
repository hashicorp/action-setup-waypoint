import * as core from '@actions/core';
import { getBinary } from './install';

export const PRODUCT_NAME = 'otto';

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
    core.setFailed(error.message);
  }
}

run();
