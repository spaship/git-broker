const { gitlab } = require('../config');
const { gitlabMergeRequest, gitlabMergeRequestOnCloseAndMerge } = require('../services/gitlab');
const { log } = require('@spaship/common/lib/logging/pino');

module.exports.post = async (req, res) => {
  const action = req.header('X-Gitlab-Event');
  const payload = req.body;
  log.info(action);
  if (action === gitlab.MERGE_REQUEST && payload?.object_attributes?.state === gitlab.STATE_OPENED) await gitlabMergeRequest(payload);
  else if (payload?.object_attributes?.state === gitlab.STATE_MERGED || payload?.object_attributes?.state === gitlab.STATE_CLOSED)
    await gitlabMergeRequestOnCloseAndMerge(payload);
  res.sendStatus(200);
};
