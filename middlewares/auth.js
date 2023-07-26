const { log } = require('@spaship/common/lib/logging/pino');
const crypto = require('crypto');
const { config } = require('../config');

const github = function (req, res, next) {
  log.info("Github Debug")
  if (!verifyGithubSignature(req)) {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
};

const gitlab = function (req, res, next) {
  log.info("Gitlab Debug")
  if (!verifyGitlabSignature(req)) {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
};

const verifyGithubSignature = (req) => {
  log.info(config.githubWebhookSecret)
  const githubSignature = crypto.createHmac('sha256', config.githubWebhookSecret).update(JSON.stringify(req.body)).digest('hex');
  return `sha256=${githubSignature}` === req.headers['x-hub-signature-256'];
};

const verifyGitlabSignature = (req) => {
  log.info(config.gitlabWebhookSecret)
  return config.gitlabWebhookSecret === req.headers['x-gitlab-token'];
};

module.exports = { github, gitlab };
