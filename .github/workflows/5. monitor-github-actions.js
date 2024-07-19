const fetch = require('node-fetch');

const TOKEN_GITHUB = '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';
const REPO_OWNER = 'nikydv';
const REPO_NAME = 'GHA';
const WORKFLOW_ID = '6. monitor-github-action.yml';  // e.g., the name of your workflow file like 'workflow.yml'

const headers = {
  'Authorization': `token ${TOKEN_GITHUB}`,
  'Accept': 'application/vnd.github.v3+json'
};

async function getWorkflowRuns() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch workflow runs: ${response.statusText}`);
  }
  return await response.json();
}

async function getJobs(runId) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/jobs`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }
  return await response.json();
}

async function monitorJobs() {
  try {
    const workflowRuns = await getWorkflowRuns();
    for (const run of workflowRuns.workflow_runs) {
      const runId = run.id;
      const createdAt = new Date(run.created_at);

      // Check if the job has been queued for more than 5 minutes
      if (new Date() - createdAt > 5 * 60 * 1000) {
        const jobs = await getJobs(runId);
        for (const job of jobs.jobs) {
          if (job.status === 'queued' && !job.started_at) {
            console.log(`Job '${job.name}' for run '${runId}' is queued but not started.`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error monitoring jobs: ${error.message}`);
  }
}

monitorJobs();
