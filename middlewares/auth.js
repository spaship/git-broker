const crypto = require('crypto');
const { config } = require('../config');
const { validateToken } = require('../services/common');

const github = function (req, res, next) {
  if (!verifyGithubSignature(req)) {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
};

const gitlab = async function  (req, res, next) {
  if (!(await verifyGitlabSignature(req))) {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
};

const events = async function (req, res, next) {
  if (!(await verifyEvent(req))) {
    res.status(401).send('Unauthorized');
    return;
  }
  next();
};

const verifyEvent = async (req) => {
  return config.gitBrokerSecret === req.headers['authorization'];
};

const verifyGithubSignature = async (req) => {
  const githubSignature = crypto.createHmac('sha256', config.githubWebhookSecret).update(JSON.stringify(req.body)).digest('hex');
  return `sha256=${githubSignature}` === req.headers['x-hub-signature-256'];
};

const verifyGitlabSignature =async (req) => {
  try{
    await validateToken(req.headers['x-gitlab-token']);
  }
  catch(error){
    return false;
  }
  return true;
};

module.exports = { github, gitlab, events };
