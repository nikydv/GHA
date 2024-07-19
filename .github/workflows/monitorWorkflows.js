const axios = require('axios');
const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, WORKFLOW_ID, TIME_THRESHOLD_MINUTES } = process.env;

const headers = {
  'Authorization': `token ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
};

const getWorkflowRuns = async () => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_ID}/runs`;
  const response = await axios.get(url, { headers });
  return response.data.workflow_runs;
};

const getJobs = async (run_id) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run_id}/jobs`;
  const response = await axios.get(url, { headers });
  return response.data.jobs;
};

const main = async () => {
  try {
    const workflowRuns = await getWorkflowRuns();
    const timeThreshold = new Date(Date.now() - TIME_THRESHOLD_MINUTES * 60000);

    for (const run of workflowRuns) {
      const createdAt = new Date(run.created_at);
      if (createdAt < timeThreshold) {
        const jobs = await getJobs(run.id);
        for (const job of jobs) {
          if (job.status === 'queued' && !job.started_at) {
            console.log(`Job '${job.name}' for run '${run.id}' is queued but not started.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflows:', error);
  }
};

main();
