const { log } = require('@spaship/common/lib/logging/pino');
const { commentOnGitlabCommit } = require('../services/gitlab/api');

module.exports.post = async (req, res) => {
  const payload = req.body;
  const { projectId, commitId, commentBody } = payload;
  log.info(payload);
  try {
    await commentOnGitlabCommit(payload, projectId, commitId, commentBody);
    return res.sendStatus(200);
  } catch (error) {
    res.status(500);
    return res.send({ message: 'Error while commenting on Gitlab' });
  }
};
