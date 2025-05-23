// lib/github.ts

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

/**
 * Instantiate an Octokit instance using GitHub App credentials.
 * Supports optional installationId for scoped access.
 * This makes it reusable for both app-wide and installation-level API calls.
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
 * Called when GitHub App receives check_suite:requested event.
 */
export async function createCheckRun(
  octokit: Octokit,
  options: Parameters<Octokit['rest']['checks']['create']>[0]
) {
  return await octokit.rest.checks.create(options);
}

/**
 * Update an existing check run.
 * Called from CI workflow via webhook to reflect job status.
 */
export async function updateCheckRun(
  octokit: Octokit,
  options: Parameters<Octokit['rest']['checks']['update']>[0]
) {
  return await octokit.rest.checks.update(options);
}
