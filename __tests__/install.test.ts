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
const PRODUCT_NAME = 'waypoint';
const VERSION = '0.8.2';
const metadataIndex = require('./metadata.json');

// Golang arch and platform (and as a result the product binaries) do not match
// naming returned by the os package, so translate those
const goArch = (arch: string): string => {
  switch (arch) {
    case 'x64':
      return 'amd64';
    case 'x32':
      return '386';
    default:
      return arch;
  }
};

describe('install tests', () => {
  beforeAll(function () {
    // Mock out the metadata request for all tests
    nock(install.releasesUrl()).persist().get(`/v1/releases/${PRODUCT_NAME}/0.8.2`).reply(200, metadataIndex);
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
    const download = nock('https://releases.hashicorp.com')
      .persist()
      .get(`/${PRODUCT_NAME}/${VERSION}/${PRODUCT_NAME}_${VERSION}_${os.platform()}_${goArch(os.arch())}.zip`)
      .replyWithFile(200, `${__dirname}/product.zip`, {
        'Content-Type': 'application/zip',
      });

    await install.getBinary(PRODUCT_NAME, VERSION);

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
    const toolPath: string = path.join(toolDir, PRODUCT_NAME, VERSION, os.arch());
    await io.mkdirP(toolPath);
    fs.writeFileSync(`${toolPath}.complete`, 'hello');
    await install.getBinary(PRODUCT_NAME, VERSION);
  });
});
