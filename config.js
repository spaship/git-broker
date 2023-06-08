module.exports = {
  env: process.env.NODE_ENV || 'dev',
  githubAccessToken: process.env.GITHUB_ACCESS_TOKEN,
  gitlabAccessToken: process.env.GITLAB_ACCESS_TOKEN,
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  gitlabWebhookSecret: process.env.GITLAB_WEBHOOK_SECRET,
  orchestratorBaseUrl: process.env.ORCHESTRATOR_BASE_URL,
  orchestratorSecret: process.env.ORCHESTRATOR_SECRET
};
