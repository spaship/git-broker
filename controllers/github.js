const { log } = require('@spaship/common/lib/logging/pino');
const { github } = require('../config');
const { githubPullRequestOnOpen, githubPullRequestOnCloseAndMerge, githubFetchComments } = require('../services/github');

module.exports.post = async (req, res) => {
  const payload = req.body;
  if (payload.action === github.PR_OPENED && payload.pull_request.state === github.STATE_OPEN) await githubPullRequestOnOpen(payload.action, payload);
  else if (payload.action === github.COMMENT_CREATED) await githubFetchComments(payload);
  else if (payload.action === github.PR_CLOSED && payload.pull_request.merged) await githubPullRequestOnCloseAndMerge(payload.action, payload);
  res.sendStatus(200);
};
