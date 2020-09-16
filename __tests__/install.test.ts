import io = require('@actions/io');
import fs = require('fs');
import os = require('os');
import path = require('path');
import * as install from '../src/install';
import nock from 'nock';

const toolDir = path.join(__dirname, 'runner', path.join(Math.random().toString(36).substring(7)), 'tools');
const tempDir = path.join(__dirname, 'runner', path.join(Math.random().toString(36).substring(7)), 'temp');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

const IS_WINDOWS = process.platform === 'win32';
const PRODUCT_NAME = 'otto';
const metadataIndex = require('./metadata.json');

describe('install tests', () => {
  beforeAll(function () {
    // Mock out the metadata request for all tests
    nock(install.releasesUrl()).persist().get(`/${PRODUCT_NAME}/index.json`).reply(200, metadataIndex);
    // We don't want any real http requests in the tests
    nock.disableNetConnect();
  });

  beforeEach(async function () {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
    await io.mkdirP(toolDir);
    await io.mkdirP(tempDir);
  });

  afterEach(function () {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  afterAll(async function () {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
  });

  it('attempts to download the tool if no version is found in the cache', async () => {
    const download = nock(install.releasesUrl())
      .persist()
      .get(`/${PRODUCT_NAME}/0.1.0/${PRODUCT_NAME}_0.1.0_darwin_amd64.zip`)
      .replyWithFile(200, `${__dirname}/product.zip`, {
        'Content-Type': 'application/zip',
      });

    await install.getBinary(PRODUCT_NAME, '0.1.0');

    expect(download.isDone()).toBe(true);
  });

  it('errors with a version that does not exist', async () => {
    let thrown = false;
    try {
      await install.getBinary(PRODUCT_NAME, '0.100.0');
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it('uses versions in the cache', async () => {
    const toolPath: string = path.join(toolDir, PRODUCT_NAME, '0.1.0', os.arch());
    await io.mkdirP(toolPath);
    fs.writeFileSync(`${toolPath}.complete`, 'hello');
    await install.getBinary(PRODUCT_NAME, '0.1.0');
  });
});
