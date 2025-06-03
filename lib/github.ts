// File: lib/github.ts
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

/**
 * Configuration interface for GitHub App authentication
 */
export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  installationId?: number;
}

/**
 * Result interface for batch operations
 */
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{ error: Error; item: unknown }>;
}

/**
 * Instantiate an Octokit instance using GitHub App credentials.
 * Supports optional installationId for scoped access.
 * This makes it reusable for both app-wide and installation-level API calls.
 */
export const createOctokitApp = (config: GitHubAppConfig): Octokit => {
  const { appId, privateKey, installationId } = config;

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
 *
 * @param octokit - Authenticated Octokit instance
 * @param options - Check run creation options
 * @returns Promise resolving to the created check run
 */
export async function createCheckRun(
  octokit: Octokit,
  options: NonNullable<Parameters<Octokit['rest']['checks']['create']>[0]>
) {
  try {
    const response = await octokit.rest.checks.create(options);

    console.log(
      `✅ Created check run: ${options.name} for SHA: ${options.head_sha}`
    );
    return response;
  } catch (error) {
    console.error(`❌ Failed to create check run: ${options.name}`, error);
    throw new Error(
      `Failed to create check run: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update an existing check run.
 * Called from CI workflow via webhook to reflect job status.
 *
 * @param octokit - Authenticated Octokit instance
 * @param options - Check run update options
 * @returns Promise resolving to the updated check run
 */
export async function updateCheckRun(
  octokit: Octokit,
  options: NonNullable<Parameters<Octokit['rest']['checks']['update']>[0]>
) {
  try {
    const response = await octokit.rest.checks.update(options);

    console.log(
      `✅ Updated check run ID: ${options.check_run_id} to status: ${options.status}`
    );
    return response;
  } catch (error) {
    console.error(
      `❌ Failed to update check run ID: ${options.check_run_id}`,
      error
    );
    throw new Error(
      `Failed to update check run: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create multiple check runs in batch with error handling.
 * Useful for creating all required checks at once.
 *
 * @param octokit - Authenticated Octokit instance
 * @param checkRunsData - Array of check run creation options
 * @returns Promise resolving to batch operation results
 */
export async function createCheckRunsBatch(
  octokit: Octokit,
  checkRunsData: NonNullable<
    Parameters<Octokit['rest']['checks']['create']>[0]
  >[]
): Promise<BatchOperationResult<Awaited<ReturnType<typeof createCheckRun>>>> {
  const results: BatchOperationResult<
    Awaited<ReturnType<typeof createCheckRun>>
  > = {
    successful: [],
    failed: [],
  };

  const promises = checkRunsData.map(async (checkData) => {
    try {
      const result = await createCheckRun(octokit, checkData);
      results.successful.push(result);
      return result;
    } catch (error) {
      results.failed.push({
        error: error instanceof Error ? error : new Error('Unknown error'),
        item: checkData,
      });
      return null;
    }
  });

  await Promise.allSettled(promises);

  console.log(
    `📊 Batch check run creation completed: ${results.successful.length} successful, ${results.failed.length} failed`
  );

  return results;
}

/**
 * Get all check runs for a specific SHA.
 * Useful for validating check statuses in auto-merge workflows.
 *
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param ref - Git reference (SHA, branch, or tag)
 * @returns Promise resolving to check runs list
 */
export async function getCheckRuns(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
) {
  try {
    const response = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref,
      per_page: 100,
    });

    console.log(
      `📋 Retrieved ${response.data.check_runs.length} check runs for ${ref}`
    );
    return response;
  } catch (error) {
    console.error(`❌ Failed to get check runs for ${ref}`, error);
    throw new Error(
      `Failed to get check runs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if all required checks are passing for a given SHA.
 * Returns detailed status information for decision making.
 *
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param ref - Git reference (SHA, branch, or tag)
 * @param requiredChecks - Array of required check names
 * @returns Promise resolving to detailed check status
 */
export async function validateRequiredChecks(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  requiredChecks: string[]
) {
  try {
    const { data: checkRuns } = await getCheckRuns(octokit, owner, repo, ref);

    const checkResults: Record<string, string> = {};
    const missingChecks: string[] = [];
    const failedChecks: string[] = [];
    const pendingChecks: string[] = [];

    for (const requiredCheck of requiredChecks) {
      const checkRun = checkRuns.check_runs.find(
        (c) => c.name === requiredCheck
      );

      if (!checkRun) {
        checkResults[requiredCheck] = 'missing';
        missingChecks.push(requiredCheck);
      } else if (checkRun.status !== 'completed') {
        checkResults[requiredCheck] = 'in_progress';
        pendingChecks.push(requiredCheck);
      } else if (checkRun.conclusion !== 'success') {
        checkResults[requiredCheck] = checkRun.conclusion || 'unknown';
        failedChecks.push(requiredCheck);
      } else {
        checkResults[requiredCheck] = 'success';
      }
    }

    const allChecksPassed =
      missingChecks.length === 0 &&
      failedChecks.length === 0 &&
      pendingChecks.length === 0;

    const result = {
      allChecksPassed,
      checkResults,
      missingChecks,
      failedChecks,
      pendingChecks,
      totalChecks: requiredChecks.length,
      completedChecks:
        requiredChecks.length - missingChecks.length - pendingChecks.length,
    };

    console.log(
      `🔍 Check validation for ${ref}: ${result.completedChecks}/${result.totalChecks} completed, ${allChecksPassed ? 'READY' : 'NOT READY'} for merge`
    );

    return result;
  } catch (error) {
    console.error(`❌ Failed to validate required checks for ${ref}`, error);
    throw new Error(
      `Failed to validate checks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retry wrapper for GitHub API calls with exponential backoff.
 * Handles rate limiting and transient errors gracefully.
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param initialDelay - Initial delay in milliseconds
 * @param backoffMultiplier - Backoff multiplier for exponential backoff
 * @returns Promise resolving to the function result
 */
export async function retryGitHubOperation<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
  backoffMultiplier = 2
): Promise<T> {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on certain errors
      if (
        lastError.message.includes('404') ||
        lastError.message.includes('403')
      ) {
        throw lastError;
      }

      if (attempt === maxRetries) {
        console.error(
          `❌ GitHub operation failed after ${maxRetries} attempts:`,
          lastError
        );
        throw lastError;
      }

      console.warn(
        `⚠️ GitHub operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError!;
}

/**
 * Get installation ID for a repository.
 * Useful when you have app credentials but need the installation ID.
 *
 * @param octokit - App-authenticated Octokit instance (without installation)
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Promise resolving to installation ID
 */
export async function getInstallationId(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<number> {
  try {
    const response = await retryGitHubOperation(() =>
      octokit.rest.apps.getRepoInstallation({ owner, repo })
    );

    const installationId = response.data?.id;
    if (!installationId) {
      throw new Error('Installation ID not found in response');
    }

    console.log(
      `🔑 Found installation ID: ${installationId} for ${owner}/${repo}`
    );
    return installationId;
  } catch (error) {
    console.error(
      `❌ Failed to get installation ID for ${owner}/${repo}`,
      error
    );
    throw new Error(
      `Failed to get installation ID: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create an installation-scoped Octokit instance from app credentials.
 * Handles the installation lookup automatically.
 *
 * @param appConfig - GitHub App configuration
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Promise resolving to installation-scoped Octokit instance
 */
export async function createInstallationOctokit(
  appConfig: Omit<GitHubAppConfig, 'installationId'>,
  owner: string,
  repo: string
): Promise<Octokit> {
  // Create app-level client to get installation ID
  const appOctokit = createOctokitApp(appConfig);

  // Get installation ID
  const installationId = await getInstallationId(appOctokit, owner, repo);

  // Create installation-scoped client
  return createOctokitApp({
    ...appConfig,
    installationId,
  });
}

/**
 * Enhanced error handler for GitHub API operations.
 * Provides detailed error information and suggestions.
 *
 * @param error - The error to handle
 * @param operation - Description of the operation that failed
 * @returns Enhanced error with additional context
 */
export function handleGitHubError(error: unknown, operation: string): Error {
  if (error instanceof Error) {
    let enhancedMessage = `${operation} failed: ${error.message}`;

    // Add specific guidance based on error type
    if (error.message.includes('404')) {
      enhancedMessage +=
        '\n💡 Possible causes: Repository not found, check run not found, or insufficient permissions.';
    } else if (error.message.includes('403')) {
      enhancedMessage +=
        '\n💡 Possible causes: Insufficient permissions, rate limit exceeded, or repository is private.';
    } else if (error.message.includes('422')) {
      enhancedMessage +=
        '\n💡 Possible causes: Invalid request data or validation errors.';
    } else if (error.message.includes('500')) {
      enhancedMessage +=
        '\n💡 Possible causes: GitHub server error, try again later.';
    }

    const enhancedError = new Error(enhancedMessage);
    enhancedError.stack = error.stack;
    return enhancedError;
  }

  return new Error(`${operation} failed: Unknown error`);
}

/**
 * Utility to check if a GitHub App has the required permissions.
 * Useful for debugging permission issues.
 *
 * @param octokit - Authenticated Octokit instance
 * @param requiredPermissions - Array of required permissions
 * @returns Promise resolving to permission check results
 */
export async function checkAppPermissions(
  octokit: Octokit,
  requiredPermissions: string[] = ['checks', 'contents', 'pull_requests']
): Promise<{
  hasAllPermissions: boolean;
  permissions: Record<string, string>;
}> {
  try {
    const response = await retryGitHubOperation(() =>
      octokit.rest.apps.getAuthenticated()
    );

    const appPermissions = response.data?.permissions || {};
    const permissionResults: Record<string, string> = {};

    for (const permission of requiredPermissions) {
      permissionResults[permission] =
        appPermissions[permission as keyof typeof appPermissions] || 'none';
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      ['read', 'write', 'admin'].includes(
        appPermissions[permission as keyof typeof appPermissions] || ''
      )
    );

    console.log(
      `🔐 App permissions check: ${hasAllPermissions ? 'SUFFICIENT' : 'INSUFFICIENT'}`
    );
    console.log('📋 Permissions:', permissionResults);

    return {
      hasAllPermissions,
      permissions: permissionResults,
    };
  } catch (error) {
    console.error('❌ Failed to check app permissions', error);
    throw handleGitHubError(error, 'Permission check');
  }
}
