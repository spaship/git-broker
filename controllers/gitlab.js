const { gitlab } = require('../config');
const { gitlabMergeRequest, gitlabMergeRequestOnCloseAndMerge } = require('../services/gitlab');

module.exports.post = async (req, res) => {
  const action = req.header('X-Gitlab-Event');
  const payload = req.body;
  if (action === gitlab.MERGE_REQUEST && payload?.object_attributes?.state === gitlab.STATE_OPENED) await gitlabMergeRequest(payload);
  else if (payload?.object_attributes?.state === gitlab.STATE_MERGED || payload?.object_attributes?.state === gitlab.STATE_CLOSED)
    await gitlabMergeRequestOnCloseAndMerge(payload);
  res.sendStatus(200);
};
