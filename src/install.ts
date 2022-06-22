import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';
import * as httpm from '@actions/http-client';
import os from 'os';

const DEFAULT_RELEASES_URL = 'https://api.releases.hashicorp.com';

interface Build {
  arch: string;
  filename: string;
  name: string;
  os: string;
  url: string;
  version: string;
}

interface Version {
  name: string;
  shasums: string;
  shasums_signature: string;
  version: string;

  builds: Build[];
}

export function releasesUrl(): string {
  return core.getInput('releases_url') || DEFAULT_RELEASES_URL;
}

async function getMetadata(product: string, version: string): Promise<Version | undefined> {
  const http = new httpm.HttpClient('action-setup-waypoint', [], {
    allowRetries: true,
    maxRetries: 5,
  });

  try {
    const resp = await http.getJson<Version>(`${releasesUrl()}/v1/releases/${product}/${version}`);

    return resp.result || undefined;
  } catch (err) {
    throw new Error(`Failed to fetch version metadata file ${err}`);
  }
}

/**
 * @param configuredVersion The version defined by a user in a semver compatible format
 *
 * @returns The toolpath where the binary is stored after being downloaded based
 * on the version
 */
export async function getBinary(product: string, configuredVersion: string): Promise<string> {
  const meta = await getMetadata(product, configuredVersion);

  if (!meta?.version) {
    throw new Error(`${product} version '${configuredVersion}' does not exist`);
  }

  // Tool path caches based on version
  let toolPath: string;
  toolPath = tc.find(product, meta.version, os.arch());

  if (toolPath) {
    // If the toolpath exists, return it instead of download the product
    core.info(`found in cache: ${toolPath}`);
    return toolPath;
  }

  // Determine the environment platform and architecture
  const platform: string = os.platform();
  const arch: string = os.arch();

  // Golang arch and platform (and as a result the product binaries) do not match
  // naming returned by the os package, so translate those
  const goArch = (): string => {
    switch (arch) {
      case 'x64':
        return 'amd64';
      case 'x32':
        return '386';
      default:
        return arch;
    }
  };

  const goPlatform = (): string => {
    switch (platform) {
      case 'win32':
        return 'windows';
      default:
        return platform;
    }
  };

  const matchingBuild: Build | undefined = meta.builds.find((build: Build) => {
    return build.os === goPlatform() && build.arch === goArch();
  });

  if (matchingBuild) {
    core.info(`downloading ${meta.version} from ${matchingBuild.url}`);

    try {
      // Download the product
      toolPath = await tc.downloadTool(matchingBuild.url);
    } catch (error) {
      core.debug(error as string);
    }

    // Extract the zip
    const extractedPath = await tc.extractZip(toolPath);

    // Installs into the tool cachedir
    return await tc.cacheDir(extractedPath, product, meta.version, os.arch());
  }

  throw new Error(`${product} version '${configuredVersion}' does not have a matching build for '${goPlatform()}_${goArch()}'`);
}
