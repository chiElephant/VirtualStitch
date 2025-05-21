// Import necessary modules from GitHub Actions toolkit and Octokit REST API
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';

(async () => {
  try {
    // Retrieve inputs provided to the action
    const sha = core.getInput('sha');
    const name = core.getInput('name');
    const status = core.getInput('status') || undefined;
    const conclusion = core.getInput('conclusion') || undefined;
    const title = core.getInput('title') || '';
    const summary = core.getInput('summary') || '';
    const details_url = core.getInput('details_url') || undefined;
    const token = core.getInput('token');

    // Extract owner and repository name from the environment variable
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

    // Fetch all check runs associated with the specified commit SHA
    // This is necessary because the Checks API requires the check run ID to update a check run,
    // and we need to find the ID corresponding to the check run name provided
    const listResponse = await octokit.checks.listForRef({
      owner,
      repo,
      ref: sha,
    });

    // Find the specific check run by name
    const checkRun = listResponse.data.check_runs.find((c) => c.name === name);
    if (!checkRun) {
      // If the check run is not found, fail the action with an appropriate message
      core.setFailed(`No check run found with name '${name}' for sha ${sha}`);
      return;
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
    // Include the details URL if provided
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
