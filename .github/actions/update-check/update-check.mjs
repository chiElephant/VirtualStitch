import * as core from '@actions/core';
import { Octokit } from '@octokit/core';

(async () => {
  try {
    const sha = core.getInput('sha');
    const name = core.getInput('name');
    const status = core.getInput('status') || undefined;
    const conclusion = core.getInput('conclusion') || undefined;
    const title = core.getInput('title') || '';
    const summary = core.getInput('summary') || '';
    const details_url = core.getInput('details_url') || undefined;
    const token = core.getInput('token');

    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

    core.info(`[DEBUG] sha=${sha}`);
    core.info(`[DEBUG] check name=${name}`);
    core.info(`[DEBUG] status=${status}`);
    core.info(`[DEBUG] conclusion=${conclusion}`);
    core.info(`[DEBUG] title=${title}`);
    core.info(`[DEBUG] summary=${summary}`);
    core.info(`[DEBUG] details_url=${details_url}`);

    const octokit = new Octokit({
      auth: token,
      request: {
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    });

    const listResponse = await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{ref}/check-runs',
      {
        owner,
        repo,
        ref: sha,
      }
    );

    const checkRun = listResponse.data.check_runs.find((c) => c.name === name);
    if (!checkRun) {
      core.setFailed(`No check run found with name '${name}' for sha ${sha}`);
      return;
    }

    const updatePayload = {
      owner,
      repo,
      check_run_id: checkRun.id,
      status,
      conclusion,
      completed_at: conclusion ? new Date().toISOString() : undefined,
      output: {
        title,
        summary,
      },
    };
    if (details_url) {
      updatePayload.details_url = details_url;
    }

    core.info(
      `[DEBUG] Sending update payload: ${JSON.stringify(updatePayload, null, 2)}`
    );

    const response = await octokit.request(
      'PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}',
      updatePayload
    );

    core.info(
      `[DEBUG] Check run updated successfully. Response: ${JSON.stringify(response.data, null, 2)}`
    );
  } catch (err) {
    core.setFailed(`[ERROR] ${err.message || err}`);
    core.info(
      `[ERROR DEBUG] ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`
    );
  }
})();
