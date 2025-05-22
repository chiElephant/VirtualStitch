// This is a testing comment.
// Import necessary modules from GitHub Actions toolkit and Octokit REST API
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

// Helper: wait for GitHub to index the commit SHA
// This function retries a GET request to the GitHub Commits API
// to check whether the given SHA is accessible.
// It's useful when GitHub hasn't fully registered the commit yet (e.g. after repository_dispatch).
// If the commit isn't found (HTTP 404 or 422), it waits and retries.
// Throws an error if the commit is not found after all attempts.
async function waitForCommit(octokit, owner, repo, sha, attempts = 6, interval = 5000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
        owner,
        repo,
        ref: sha,
      });
      core.info(`✅ Commit ${sha} is now available.`);
      return true;
    } catch (err) {
      if (err.status === 422 || err.status === 404) {
        core.info(`⏳ Commit ${sha} not found (attempt ${i}/${attempts}). Retrying in ${interval / 1000}s...`);
        await new Promise(res => setTimeout(res, interval));
      } else {
        throw err;
      }
    }
  }
  throw new Error(`🛑 Commit ${sha} not available after ${attempts} retries.`);
}

(async () => {
  try {
    // Retrieve inputs provided to the action
    const sha = core.getInput('sha');
    const name = core.getInput('name');
    const status = core.getInput('status');
    const conclusion = core.getInput('conclusion');
    const title = core.getInput('title');
    const summary = core.getInput('summary');
    const details_url = core.getInput('details_url') || '';
    const token = core.getInput('token');

    // Extract owner and repository name from the environment variable
    // This is automatically set by GitHub Actions as "owner/repo"
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

    // Log debug information for tracing
    core.info(`[DEBUG] sha=${sha}`);
    core.info(`[DEBUG] check name=${name}`);
    core.info(`[DEBUG] status=${status}`);
    core.info(`[DEBUG] conclusion=${conclusion}`);
    core.info(`[DEBUG] title=${title}`);
    core.info(`[DEBUG] summary=${summary}`);
    core.info(`[DEBUG] details_url=${details_url}`);

    
    // Initialize Octokit with the provided token for authentication
    const octokit = new Octokit({
      auth: token,
    });
    
    // Wait for the GitHub API to recognize the commit before proceeding
    await waitForCommit(octokit, owner, repo, sha);
    
    // Fetch all check runs associated with the specified commit SHA
    // This is necessary because the Checks API requires the check run ID to update a check run,
    // and we need to find the ID corresponding to the check run name provided
    const listResponse = await octokit.checks.listForRef({
      owner,
      repo,
      ref: sha,
    });

    // Find the specific check run by name
    let checkRun = listResponse.data.check_runs.find((c) => c.name === name);

    if (!checkRun) {
      core.info(`ℹ️ No check run found for '${name}' on sha ${sha}. Creating one now...`);

      // Manually create the check run if it wasn't auto-created (e.g., from a dispatch event)
      // This happens when the workflow is triggered on a SHA that GitHub hasn't run jobs for
      const createResponse = await octokit.checks.create({
        owner,
        repo,
        name,
        head_sha: sha,
        status: status || 'in_progress',
        started_at: new Date().toISOString(), // 👈 Add this line
        output: {
          title: title || name,
          summary: summary || '',
        },
        details_url: details_url || undefined,
      });

      checkRun = createResponse.data;
      core.info(`✅ Created check run '${name}' with ID ${checkRun.id}`);
    }

    // Prepare the payload for updating the check run
    const updatePayload = {
      owner,
      repo,
      check_run_id: checkRun.id,
      status,
      conclusion,
      // If a conclusion is provided, set the completed_at timestamp to the current time
      completed_at: conclusion ? new Date().toISOString() : undefined,
      output: {
        title,
        summary,
      },
    };
    
    // Include the details URL if provided (shown in the GitHub Checks UI for user navigation)
    if (details_url) {
      updatePayload.details_url = details_url;
    }

    // Log the payload for debugging purposes
    core.info(
      `[DEBUG] Sending update payload: ${JSON.stringify(updatePayload, null, 2)}`
    );

    // Send the request to update the check run
    const response = await octokit.checks.update(updatePayload);

    // Log the response from the update operation
    core.info(
      `[DEBUG] Check run updated successfully. Response: ${JSON.stringify(response.data, null, 2)}`
    );
  } catch (err) {
    // If an error occurs, fail the action and log the error details
    core.setFailed(`[ERROR] ${err.message || err}`);
    core.info(
      `[ERROR DEBUG] ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`
    );
  }
})();
