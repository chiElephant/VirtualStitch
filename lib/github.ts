// lib/github.ts

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

/**
 * Instantiate an Octokit instance using GitHub App credentials.
 */
export const createOctokitApp = (
  appId: string,
  privateKey: string,
  installationId?: number
): Octokit => {
  return new Octokit({
    authStrategy: createAppAuth,
    auth:
      installationId ?
        { appId, privateKey, installationId }
      : { appId, privateKey },
  });
};

/**
 * Create a new check run with default "queued" state.
 */
export async function createCheckRun(
  octokit: Octokit,
  options: Parameters<Octokit['rest']['checks']['create']>[0]
) {
  return await octokit.rest.checks.create(options);
}

/**
 * Update an existing check run.
 */
export async function updateCheckRun(
  octokit: Octokit,
  options: Parameters<Octokit['rest']['checks']['update']>[0]
) {
  return await octokit.rest.checks.update(options);
}
