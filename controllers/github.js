const { log } = require('@spaship/common/lib/logging/pino');
const { github } = require('../config');
const { githubPullRequestOnOpen, githubPullRequestOnCloseAndMerge } = require('../services/github/github');

module.exports.post = async (req, res) => {
  const payload = req.body;
  log.info(payload);
  if (payload.action === github.PR_OPENED && payload.pull_request.state === github.STATE_OPEN) await githubPullRequestOnOpen(payload.action, payload);
  if (payload.action === github.PR_CLOSED && payload.pull_request.merged) await githubPullRequestOnCloseAndMerge(payload.action, payload);
  res.sendStatus(200);
};
