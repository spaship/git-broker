const { gitlab } = require('../config');
const { gitlabPushRequest, gitlabCommentOnCommit, gitlabMergeRequest } = require('../services/gitlab');
const { log } = require('@spaship/common/lib/logging/pino');

module.exports.post = async (req, res) => {
  const action = req.header('X-Gitlab-Event');
  const payload = req.body;
  log.info(action);

  if (action === gitlab.PUSH_REQUEST && payload?.event_name === gitlab.STATE_PUSHED) await gitlabPushRequest(payload);
  else if (action === gitlab.COMMENT_REQUEST) await gitlabCommentOnCommit(payload);
  else if (action === gitlab.MERGE_REQUEST && payload?.object_attributes?.state === gitlab.STATE_OPENED) await gitlabMergeRequest(payload);
  /* @internal To be used during the ephemeral env support for containerized deployments  
  else if (payload?.object_attributes?.state === gitlab.STATE_MERGED || payload?.object_attributes?.state === gitlab.STATE_CLOSED) await gitlabMergeRequestOnCloseAndMerge(payload);
  */
  res.sendStatus(200);
};
